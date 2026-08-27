'use client';

import { useActionState, useState } from 'react';
import { Check, ShieldCheck, Users, Building2 } from 'lucide-react';
import { submitFanContribution, type CheckoutState } from '@/lib/checkout/actions';
import { AmountChooser, type AmountOption } from './AmountChooser';
import { Field, CheckField } from '@/components/primitives/Field';
import { SubmitRow } from './SubmitRow';

export type FanFormLabels = Record<
  | 'amount' | 'identity' | 'payment' | 'custom' | 'customPlaceholder'
  | 'email' | 'displayName' | 'instagram' | 'city' | 'optional'
  | 'anonymous' | 'hideAmount' | 'consentBody' | 'consentCheckbox'
  | 'submit' | 'working' | 'chooseRole' | 'fanRole' | 'fanRoleSub'
  | 'businessRole' | 'businessRoleSub' | 'yourSelection' | 'tierBenefits'
  | 'secure' | 'secureSub',
  string
>;

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-6 font-ui text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--text)]">
        <span className="text-[var(--champagne)]">STEP {n}</span>
        <span className="mx-2 text-[var(--line-strong)]">—</span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

export function FanCheckoutForm({
  campaignId,
  options,
  labels,
  currencySymbol,
  sponsorHref,
}: {
  campaignId: string;
  options: AmountOption[];
  labels: FanFormLabels;
  currencySymbol: string;
  sponsorHref: string | null;
}) {
  const [state, action] = useActionState<CheckoutState, FormData>(
    submitFanContribution,
    {},
  );
  const [selectedId, setSelectedId] = useState<string | null>(options[0]?.id ?? null);
  const selected = options.find((o) => o.id === selectedId) ?? null;

  return (
    <form action={action} className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_21rem]">
      <input type="hidden" name="campaignId" value={campaignId} />
      {/* Honeypot. Hidden from people and from assistive technology. */}
      <input
        type="text"
        name="company_website_confirm"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="flex flex-col gap-12">
        {/* Role: fan is already chosen by being here; business links away. */}
        <Step n={1} title={labels.chooseRole}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div
              className="relative flex flex-col items-center gap-2 rounded-[var(--radius-panel)] border p-6 text-center"
              style={{
                borderColor: 'var(--champagne)',
                background: 'var(--ink-2)',
                boxShadow: 'var(--glow-champagne)',
              }}
            >
              <span
                className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full"
                style={{ background: 'var(--champagne)' }}
              >
                <Check aria-hidden size={12} color="var(--ink)" />
              </span>
              <Users aria-hidden size={26} color="var(--champagne)" />
              <p className="font-display text-base uppercase tracking-[0.08em] text-[var(--champagne)]">
                {labels.fanRole}
              </p>
              <p className="text-body text-[var(--text-dim)]">{labels.fanRoleSub}</p>
            </div>

            <a
              href={sponsorHref ?? '/partners'}
              className="flex flex-col items-center gap-2 rounded-[var(--radius-panel)] border p-6 text-center transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--champagne)]"
              style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
            >
              <Building2 aria-hidden size={26} color="var(--text-dim)" />
              <p className="font-display text-base uppercase tracking-[0.08em] text-[var(--text)]">
                {labels.businessRole}
              </p>
              <p className="text-body text-[var(--text-dim)]">{labels.businessRoleSub}</p>
            </a>
          </div>
        </Step>

        <Step n={2} title={labels.amount}>
          <AmountChooser
            options={options}
            fieldName="tierId"
            customLabel={labels.custom}
            customPlaceholder={labels.customPlaceholder}
            currencySymbol={currencySymbol}
            selectedId={selectedId}
            onSelect={setSelectedId}
            showSummary={false}
          />
        </Step>

        <Step n={3} title={labels.identity}>
          <div className="flex flex-col gap-8">
            <Field label={labels.email} name="email" type="email" required inputMode="email" />
            <div className="grid gap-8 md:grid-cols-2">
              <Field
                label={labels.displayName}
                name="displayName"
                optionalLabel={labels.optional}
              />
              <Field label={labels.instagram} name="instagram" optionalLabel={labels.optional} />
            </div>
            <Field label={labels.city} name="city" optionalLabel={labels.optional} />
            <div className="flex flex-col gap-4">
              <CheckField label={labels.anonymous} name="anonymous" />
              <CheckField label={labels.hideAmount} name="hideAmount" />
            </div>
          </div>
        </Step>

        <Step n={4} title={labels.payment}>
          <p className="mb-7 max-w-[62ch] text-body text-[var(--text-dim)]">
            {labels.consentBody}
          </p>
          <div className="mb-8">
            <CheckField label={labels.consentCheckbox} name="consent" />
          </div>
          <SubmitRow label={labels.submit} workingLabel={labels.working} error={state.error} />
        </Step>
      </div>

      {/* Live selection sidebar */}
      <aside className="lg:sticky lg:top-6 lg:h-fit">
        <div
          className="rounded-[var(--radius-panel)] border p-6"
          style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
        >
          <p className="font-ui text-[0.625rem] uppercase tracking-[0.24em] text-[var(--text-dim)]">
            {labels.yourSelection}
          </p>

          <div className="mt-5 flex items-baseline justify-between gap-4">
            <p className="font-display text-lg uppercase tracking-[0.06em] text-[var(--champagne)]">
              {selected?.label ?? labels.custom}
            </p>
            <p className="font-serif text-2xl text-gold">{selected?.amountLabel ?? '—'}</p>
          </div>

          {selected?.benefits?.length ? (
            <>
              <span className="rule-gold my-5 block h-px w-full opacity-40" />
              <p className="font-ui text-[0.625rem] uppercase tracking-[0.24em] text-[var(--text-dim)]">
                {labels.tierBenefits}
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {selected.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-body text-[var(--text-dim)]">
                    <Check aria-hidden size={15} color="var(--champagne)" className="mt-1 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <span className="rule-gold my-5 block h-px w-full opacity-40" />

          <p className="flex items-center gap-2 font-ui text-xs text-[var(--text)]">
            <ShieldCheck aria-hidden size={15} color="var(--champagne)" />
            {labels.secure}
          </p>
          <p className="mt-2 text-body text-[var(--text-dim)]">{labels.secureSub}</p>
        </div>
      </aside>
    </form>
  );
}
