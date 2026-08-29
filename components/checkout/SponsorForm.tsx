'use client';

import {
  Check,
  Crown,
  ShieldCheck,
} from 'lucide-react';
import {
  useActionState,
  useMemo,
  useState,
} from 'react';
import {
  submitSponsorship,
  type CheckoutState,
} from '@/lib/checkout/actions';
import {
  AmountChooser,
  type AmountOption,
} from './AmountChooser';
import {
  Field,
  CheckField,
} from '@/components/primitives/Field';
import { SubmitRow } from './SubmitRow';
import { SponsorLogoUpload } from './SponsorLogoUpload';
import {
  StripePaymentStep,
} from './StripePaymentStep';


export type SponsorFormLabels = Record<
  | 'packages'
  | 'business'
  | 'payment'
  | 'custom'
  | 'customPlaceholder'
  | 'businessName'
  | 'repName'
  | 'email'
  | 'phone'
  | 'website'
  | 'instagram'
  | 'industry'
  | 'message'
  | 'optional'
  | 'logo'
  | 'logoHelp'
  | 'logoChoose'
  | 'logoRemove'
  | 'consentBody'
  | 'consentCheckbox'
  | 'submit'
  | 'working'
  | 'summary'
  | 'selectedPackage'
  | 'customSponsorship'
  | 'approvalHeading'
  | 'claimHeading'
  | 'claimBody',
  string
>;

type SponsorFormProps = {
  campaignId: string;
  options: AmountOption[];
  labels: SponsorFormLabels;
  currencySymbol: string;
  approvalNote: string | null;
  claimTop: boolean;
  minimumToLeadInput: string;
  minimumToLeadLabel: string;
};

export function SponsorForm({
  campaignId,
  options,
  labels,
  currencySymbol,
  approvalNote,
  claimTop,
  minimumToLeadInput,
  minimumToLeadLabel,
}: SponsorFormProps) {
  const initialId =
    claimTop
      ? null
      : options.find((option) => !option.disabled)?.id ??
        null;

  const [state, action] = useActionState<
    CheckoutState,
    FormData
  >(submitSponsorship, {});

  const [selectedId, setSelectedId] =
    useState<string | null>(initialId);

  const [customAmount, setCustomAmount] =
    useState<string>(
      claimTop ? minimumToLeadInput : '',
    );

  const selectedOption = useMemo(
    () =>
      options.find(
        (option) => option.id === selectedId,
      ) ?? null,
    [options, selectedId],
  );

  const summaryAmount =
    selectedOption?.amountLabel ??
    (customAmount
      ? `${currencySymbol}${customAmount}`
      : '—');

  if (state.payment) {
    return (
      <StripePaymentStep
        clientSecret={
          state.payment
            .clientSecret
        }
        returnPath={
          state.payment
            .returnPath
        }
        heading={
          labels.payment
        }
        submitLabel={
          labels.submit
        }
        workingLabel={
          labels.working
        }
      />
    );
  }

  return (

    <form action={action} className="sponsor-v3-form">
      <input
        type="hidden"
        name="campaignId"
        value={campaignId}
      />

      <input
        type="hidden"
        name="claimTop"
        value={claimTop ? 'true' : ''}
      />

      <input
        type="text"
        name="company_website_confirm"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {claimTop ? (
        <section
className={[
  'sponsor-v3-claim',
  'mb-8 flex items-start gap-4',
  'rounded-[var(--radius-panel)]',
  'border border-[rgba(201,162,39,0.55)]',
  'bg-[rgba(201,162,39,0.055)] p-5',
].join(' ')}
        >
          <span
            className={[
              'flex h-11 w-11 shrink-0 items-center justify-center',
              'rounded-full bg-[rgba(201,162,39,0.12)]',
            ].join(' ')}
          >
            <Crown
              aria-hidden
              size={19}
              color="var(--champagne)"
            />
          </span>

          <div>
            <h2 className="font-ui text-xs font-semibold uppercase tracking-[0.16em] text-[var(--champagne)]">
              {labels.claimHeading}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
              {labels.claimBody}
            </p>

            <p className="numeric mt-3 font-serif text-2xl text-[var(--text)]">
              {minimumToLeadLabel}
            </p>
          </div>
        </section>
      ) : null}

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-12">
        <div className="flex min-w-0 flex-col gap-10">
          <fieldset
className={[
  'sponsor-v3-form-fieldset',
  'rounded-[var(--radius-panel)]',
  'border border-[var(--line)]',
  'bg-[var(--ink-2)] p-5 sm:p-7',
].join(' ')}
          >
            <legend className="px-2 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-[var(--champagne)]">
              01 / {labels.packages}
            </legend>

            <div className="mt-3">
              <AmountChooser
                options={options}
                fieldName="packageId"
                customLabel={labels.custom}
                customPlaceholder={
                  labels.customPlaceholder
                }
                currencySymbol={currencySymbol}
                selectedId={selectedId}
                onSelect={setSelectedId}
                customDefaultValue={
                  claimTop
                    ? minimumToLeadInput
                    : undefined
                }
                onCustomAmountChange={
                  setCustomAmount
                }
                showSummary={false}
              />
            </div>
          </fieldset>

          <fieldset
className={[
  'sponsor-v3-form-fieldset',
  'rounded-[var(--radius-panel)]',
  'border border-[var(--line)]',
  'bg-[var(--ink-2)] p-5 sm:p-7',
].join(' ')}
          >
            <legend className="px-2 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-[var(--champagne)]">
              02 / {labels.business}
            </legend>

            <div className="mt-3 flex flex-col gap-7">
              <Field
                label={labels.businessName}
                name="businessName"
                required
                autoComplete="organization"
              />

              <div className="grid gap-7 md:grid-cols-2">
                <Field
                  label={labels.repName}
                  name="repName"
                  required
                  autoComplete="name"
                />

                <Field
                  label={labels.email}
                  name="email"
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="email"
                />
              </div>

              <div className="grid gap-7 md:grid-cols-2">
                <Field
                  label={labels.phone}
                  name="phone"
                  type="tel"
                  optionalLabel={labels.optional}
                  inputMode="tel"
                  autoComplete="tel"
                />

                <Field
                  label={labels.website}
                  name="website"
                  type="url"
                  optionalLabel={labels.optional}
                  inputMode="url"
                  autoComplete="url"
                />
              </div>

              <div className="grid gap-7 md:grid-cols-2">
                <Field
                  label={labels.instagram}
                  name="instagram"
                  optionalLabel={labels.optional}
                />

                <Field
                  label={labels.industry}
                  name="industry"
                  required
                  autoComplete="organization-title"
                />
              </div>

              <SponsorLogoUpload
                label={labels.logo}
                help={labels.logoHelp}
                chooseLabel={labels.logoChoose}
                removeLabel={labels.logoRemove}
              />

              <label className="flex flex-col gap-2.5">
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-ui text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-dim)]">
                    {labels.message}
                  </span>

                  <span className="font-ui text-[0.5625rem] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                    {labels.optional}
                  </span>
                </span>

                <textarea
                  name="message"
                  rows={5}
                  maxLength={1000}
                  className={[
                    'w-full resize-y rounded-[var(--radius-panel)]',
                    'border border-[var(--line)]',
                    'bg-[var(--field-bg)] px-4 py-3',
                    'text-base leading-6 text-[var(--text)]',
                    'transition-[border-color,box-shadow]',
                    'focus:border-[var(--champagne)]',
                    'focus:outline-none focus:ring-2',
                    'focus:ring-[rgba(201,162,39,0.16)]',
                  ].join(' ')}
                />
              </label>
            </div>
          </fieldset>

          <fieldset
className={[
  'sponsor-v3-form-fieldset',
  'rounded-[var(--radius-panel)]',
  'border border-[var(--line)]',
  'bg-[var(--ink-2)] p-5 sm:p-7',
].join(' ')}
          >
            <legend className="px-2 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-[var(--champagne)]">
              03 / {labels.payment}
            </legend>

            <div className="mt-3">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  aria-hidden
                  size={19}
                  className="mt-0.5 shrink-0 text-[var(--champagne)]"
                />

                <p className="max-w-[62ch] text-sm leading-6 text-[var(--text-dim)]">
                  {labels.consentBody}
                </p>
              </div>

              {approvalNote ? (
                <div
                  className={[
                    'mt-5 rounded-[var(--radius-panel)]',
                    'border border-[var(--line)]',
                    'bg-[var(--ink)] p-4',
                  ].join(' ')}
                >
                  <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[var(--champagne)]">
                    {labels.approvalHeading}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
                    {approvalNote}
                  </p>
                </div>
              ) : null}

              <div className="mt-6">
                <CheckField
                  label={labels.consentCheckbox}
                  name="consent"
                  required
                />
              </div>

              <div className="mt-7 xl:hidden">
                <SubmitRow
                  label={labels.submit}
                  workingLabel={labels.working}
                  error={state.error}
                />
              </div>
            </div>
          </fieldset>
        </div>

        <aside className="sponsor-v3-summary hidden xl:sticky xl:top-28 xl:block">
          <div
            className={[
              'overflow-hidden rounded-[var(--radius-panel)]',
              'border border-[rgba(201,162,39,0.42)]',
              'bg-[var(--ink-2)]',
            ].join(' ')}
            style={{
              boxShadow:
                '0 24px 70px rgba(0,0,0,0.35)',
            }}
          >
            <div className="border-b border-[var(--line)] p-6">
              <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-[var(--champagne)]">
                {labels.summary}
              </p>

              <p className="numeric mt-5 font-serif text-4xl leading-none text-gold">
                {summaryAmount}
              </p>

              <p className="mt-3 font-ui text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text)]">
                {selectedOption?.label ??
                  labels.customSponsorship}
              </p>
            </div>

            {selectedOption?.benefits?.length ? (
              <div className="p-6">
                <p className="font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                  {labels.selectedPackage}
                </p>

                <ul className="mt-4 flex flex-col gap-3">
                  {selectedOption.benefits.map(
                    (benefit) => (
                      <li
                        key={benefit}
                        className="flex items-start gap-3 text-sm leading-6 text-[var(--text-dim)]"
                      >
                        <Check
                          aria-hidden
                          size={15}
                          className="mt-1 shrink-0 text-[var(--champagne)]"
                        />
                        {benefit}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ) : null}

            <div className="border-t border-[var(--line)] p-6">
              <SubmitRow
                label={labels.submit}
                workingLabel={labels.working}
                error={state.error}
              />
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
