'use client';

import { useActionState } from 'react';
import { submitFanContribution, type CheckoutState } from '@/lib/checkout/actions';
import { AmountChooser, type AmountOption } from './AmountChooser';
import { Field, CheckField } from '@/components/primitives/Field';
import { SubmitRow } from './SubmitRow';

export type FanFormLabels = Record<
  | 'amount' | 'identity' | 'payment' | 'custom' | 'customPlaceholder'
  | 'email' | 'displayName' | 'instagram' | 'city' | 'optional'
  | 'anonymous' | 'hideAmount' | 'consentBody' | 'consentCheckbox'
  | 'submit' | 'working',
  string
>;

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <legend className="mb-8 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
      {children}
    </legend>
  );
}

export function FanCheckoutForm({
  campaignId,
  options,
  labels,
  currencySymbol,
}: {
  campaignId: string;
  options: AmountOption[];
  labels: FanFormLabels;
  currencySymbol: string;
}) {
  const [state, action] = useActionState<CheckoutState, FormData>(
    submitFanContribution,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-20">
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

      <fieldset>
        <Legend>{labels.amount}</Legend>
        <AmountChooser
          options={options}
          fieldName="tierId"
          customLabel={labels.custom}
          customPlaceholder={labels.customPlaceholder}
          currencySymbol={currencySymbol}
        />
      </fieldset>

      <fieldset>
        <Legend>{labels.identity}</Legend>
        <div className="flex flex-col gap-10">
          <Field label={labels.email} name="email" type="email" required inputMode="email" />
          <Field
            label={labels.displayName}
            name="displayName"
            optionalLabel={labels.optional}
          />
          <div className="grid gap-10 md:grid-cols-2">
            <Field label={labels.instagram} name="instagram" optionalLabel={labels.optional} />
            <Field label={labels.city} name="city" optionalLabel={labels.optional} />
          </div>
          <div className="flex flex-col gap-4">
            <CheckField label={labels.anonymous} name="anonymous" />
            <CheckField label={labels.hideAmount} name="hideAmount" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <Legend>{labels.payment}</Legend>
        <p className="mb-8 max-w-[62ch] text-body text-[var(--text-dim)]">
          {labels.consentBody}
        </p>
        <div className="mb-10">
          <CheckField label={labels.consentCheckbox} name="consent" />
        </div>
        <SubmitRow label={labels.submit} workingLabel={labels.working} error={state.error} />
      </fieldset>
    </form>
  );
}
