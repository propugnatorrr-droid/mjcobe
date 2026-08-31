'use client';

import { useActionState, useState } from 'react';
import {
  Building2,
  Check,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  submitFanContribution,
  type CheckoutState,
} from '@/lib/checkout/actions';
import {
  AmountChooser,
  type AmountOption,
} from '@/components/checkout/AmountChooser';
import {
  Field,
  CheckField,
} from '@/components/primitives/Field';
import { SubmitRow } from '@/components/checkout/SubmitRow';
import {
  StripePaymentStep,
} from '@/components/checkout/StripePaymentStep';
import { interpolate } from '@/lib/copy/defaults';

export type FanFormLabels = Record<
  | 'amount'
  | 'identity'
  | 'payment'
  | 'custom'
  | 'customPlaceholder'
  | 'customRange'
  | 'tierUnavailable'
  | 'tierChanged'
  | 'email'
  | 'displayName'
  | 'instagram'
  | 'city'
  | 'optional'
  | 'anonymous'
  | 'hideAmount'
  | 'consentBody'
  | 'consentCheckbox'
  | 'submit'
  | 'working'
  | 'chooseRole'
  | 'fanRole'
  | 'fanRoleSub'
  | 'businessRole'
  | 'businessRoleSub'
  | 'yourSelection'
  | 'tierBenefits'
  | 'secure'
  | 'secureSub'
  | 'stepLabel',
  string
>;

function CheckoutStep({
  number,
  title,
  stepLabel,
  children,
}: {
  number: number;
  title: string;
  stepLabel: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset
className={[
  'checkout-v3-step',
  'rounded-[var(--radius-panel)]',
  'border border-[var(--line)]',
  'bg-[var(--panel-soft)] p-5',
  'sm:p-7 lg:p-8',
].join(' ')}
    >
      <legend className="sr-only">
        {interpolate(stepLabel, { number })}: {title}
      </legend>

      <div
        aria-hidden
        className="mb-7 flex items-center gap-4"
      >
        <span
          className={[
            'numeric flex h-8 w-8 shrink-0 items-center justify-center',
            'rounded-full border border-[var(--champagne)]',
            'text-xs font-semibold text-[var(--champagne)]',
          ].join(' ')}
        >
          {number}
        </span>

        <div className="min-w-0">
          <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.2em] text-[var(--champagne)]">
            {interpolate(stepLabel, { number })}
          </p>

          <h2 className="mt-1 font-display text-xl uppercase tracking-[0.08em] text-[var(--text)] sm:text-2xl">
            {title}
          </h2>
        </div>

        <span className="rule-gold h-px flex-1 opacity-40" />
      </div>

      {children}
    </fieldset>
  );
}

function availableInitialId(
  options: AmountOption[],
  requestedId?: string,
) {
  if (requestedId) {
    return (
      options.find(
        (option) =>
          option.id === requestedId &&
          !option.disabled,
      )?.id ?? null
    );
  }

  return (
    options.find(
      (option) => !option.disabled,
    )?.id ?? null
  );
}


export function FanCheckoutForm({
  campaignId,
  checkoutAttemptKey,
  options,
  labels,
  currencySymbol,
  sponsorHref,
  initialTierId,
  customMin,
  customMax,
  initialTierUnavailable,
}: {
  campaignId: string;
  checkoutAttemptKey: string;
  options: AmountOption[];
  labels: FanFormLabels;
  currencySymbol: string;
  sponsorHref: string | null;
  initialTierId?: string;
  customMin: string;
  customMax: string;
  initialTierUnavailable: boolean;
}) {
  const [state, action] = useActionState<
    CheckoutState,
    FormData
  >(submitFanContribution, {});

  const [selectedId, setSelectedId] = useState<string | null>(
    availableInitialId(options, initialTierId),
  );

  const [customAmount, setCustomAmount] = useState('');

  const selected =
    options.find((option) => option.id === selectedId) ??
    null;

  const selectedAmount = selected
    ? selected.amountLabel
    : customAmount
      ? `${currencySymbol}${customAmount}`
      : '—';

  const selectedLabel =
    selected?.label ?? labels.custom;

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
    <form
      action={action}
className={[
  'checkout-v3-form',
  'grid grid-cols-1 gap-8',
  'lg:grid-cols-[minmax(0,1fr)_22rem]',
  'lg:items-start lg:gap-10',
].join(' ')}
    >
      <input
        type="hidden"
        name="campaignId"
        value={campaignId}
      />

      <input
        type="hidden"
        name="checkoutAttemptKey"
        value={checkoutAttemptKey}
      />

      <input
        type="text"
        name="company_website_confirm"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="flex min-w-0 flex-col gap-6">
        {initialTierUnavailable ? (
          <div
            role="alert"
            className={[
              'rounded-[var(--radius-panel)]',
              'border border-[rgba(201,162,39,0.42)]',
              'bg-[rgba(201,162,39,0.07)]',
              'px-5 py-4',
            ].join(' ')}
          >
            <p className="text-sm leading-6 text-[var(--text)]">
              {labels.tierChanged}
            </p>
          </div>
        ) : null}

        <CheckoutStep
          number={1}
          title={labels.chooseRole}
          stepLabel={labels.stepLabel}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              className={[
                'relative flex min-h-36 flex-col items-center justify-center',
                'rounded-[var(--radius-panel)] border',
                'p-6 text-center',
              ].join(' ')}
              style={{
                borderColor: 'var(--champagne)',
                background: 'rgba(201, 162, 39, 0.055)',
                boxShadow:
                  '0 0 24px rgba(201, 162, 39, 0.12)',
              }}
            >
              <span
                aria-hidden
                className={[
                  'absolute right-3 top-3',
                  'flex h-5 w-5 items-center justify-center',
                  'rounded-full bg-[var(--champagne)]',
                ].join(' ')}
              >
                <Check
                  size={12}
                  strokeWidth={2.5}
                  color="var(--ink)"
                />
              </span>

              <Users
                aria-hidden
                size={26}
                strokeWidth={1.7}
                color="var(--champagne)"
              />

              <p className="mt-3 font-display text-lg uppercase tracking-[0.08em] text-[var(--champagne)]">
                {labels.fanRole}
              </p>

              <p className="mt-2 max-w-[25ch] text-sm leading-6 text-[var(--text-dim)]">
                {labels.fanRoleSub}
              </p>
            </div>

            <a
              href={sponsorHref ?? '/partners'}
              className={[
                'flex min-h-36 flex-col items-center justify-center',
                'rounded-[var(--radius-panel)]',
                'border border-[var(--line)]',
                'bg-[var(--ink-2)] p-6 text-center',
                'transition-[border-color,background-color]',
                '[transition-duration:var(--duration-signature)]',
                'hover:border-[var(--champagne)]',
                'hover:bg-[rgba(201,162,39,0.035)]',
              ].join(' ')}
            >
              <Building2
                aria-hidden
                size={26}
                strokeWidth={1.7}
                color="var(--text-dim)"
              />

              <p className="mt-3 font-display text-lg uppercase tracking-[0.08em] text-[var(--text)]">
                {labels.businessRole}
              </p>

              <p className="mt-2 max-w-[25ch] text-sm leading-6 text-[var(--text-dim)]">
                {labels.businessRoleSub}
              </p>
            </a>
          </div>
        </CheckoutStep>

        <CheckoutStep
          number={2}
          title={labels.amount}
          stepLabel={labels.stepLabel}
        >
          <AmountChooser
            options={options}
            fieldName="tierId"
            customLabel={labels.custom}
            customPlaceholder={
              labels.customPlaceholder
            }
            currencySymbol={currencySymbol}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCustomAmountChange={
              setCustomAmount
            }
            customMin={customMin}
            customMax={customMax}
            customRange={labels.customRange}
            unavailableLabel={
              labels.tierUnavailable
            }
            showSummary={false}
          />

        </CheckoutStep>

        <CheckoutStep
          number={3}
          title={labels.identity}
          stepLabel={labels.stepLabel}
        >
          <div className="flex flex-col gap-6">
            <Field
              label={labels.email}
              name="email"
              type="email"
              required
              inputMode="email"
              autoComplete="email"
            />

            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label={labels.displayName}
                name="displayName"
                optionalLabel={labels.optional}
                autoComplete="nickname"
              />

              <Field
                label={labels.instagram}
                name="instagram"
                optionalLabel={labels.optional}
                autoComplete="off"
              />
            </div>

            <Field
              label={labels.city}
              name="city"
              optionalLabel={labels.optional}
              autoComplete="address-level2"
            />

            <div className="grid gap-3 md:grid-cols-2">
              <CheckField
                label={labels.anonymous}
                name="anonymous"
              />

              <CheckField
                label={labels.hideAmount}
                name="hideAmount"
              />
            </div>
          </div>
        </CheckoutStep>

        <CheckoutStep
          number={4}
          title={labels.payment}
          stepLabel={labels.stepLabel}
        >
          <p className="mb-6 max-w-[62ch] text-sm leading-7 text-[var(--text-dim)]">
            {labels.consentBody}
          </p>

          <div className="mb-6">
            <CheckField
              label={labels.consentCheckbox}
              name="consent"
              required
            />
          </div>

          <SubmitRow
            label={labels.submit}
            workingLabel={labels.working}
            error={state.error}
          />
        </CheckoutStep>
      </div>

      <aside className="checkout-v3-summary order-first lg:sticky lg:top-[calc(var(--header-height-desktop)+1.5rem)] lg:order-none">
        <div
          className={[
            'overflow-hidden rounded-[var(--radius-panel)]',
            'border border-[rgba(201,162,39,0.42)]',
            'bg-[var(--ink-2)]',
            'shadow-[var(--shadow-panel)]',
          ].join(' ')}
        >
          <div className="border-b border-[var(--line)] p-6">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">
              {labels.yourSelection}
            </p>

            <div className="mt-5 flex items-end justify-between gap-4">
              <p className="font-display text-xl uppercase tracking-[0.06em] text-[var(--champagne)]">
                {selectedLabel}
              </p>

              <p className="numeric font-serif text-3xl leading-none text-gold">
                {selectedAmount}
              </p>
            </div>
          </div>

          {selected?.benefits?.length ? (
            <div className="border-b border-[var(--line)] p-6">
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                {labels.tierBenefits}
              </p>

              <ul className="mt-4 flex flex-col gap-3">
                {selected.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 text-sm leading-6 text-[var(--text-dim)]"
                  >
                    <Check
                      aria-hidden
                      size={15}
                      color="var(--champagne)"
                      className="mt-1 shrink-0"
                    />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="p-6">
            <p className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
              <ShieldCheck
                aria-hidden
                size={17}
                strokeWidth={1.8}
                color="var(--champagne)"
              />
              {labels.secure}
            </p>

            <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
              {labels.secureSub}
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
