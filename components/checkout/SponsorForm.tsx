'use client';

import { useActionState } from 'react';
import { submitSponsorship, type CheckoutState } from '@/lib/checkout/actions';
import { AmountChooser, type AmountOption } from './AmountChooser';
import { Field, CheckField } from '@/components/primitives/Field';
import { SubmitRow } from './SubmitRow';

export type SponsorFormLabels = Record<
  | 'amount' | 'business' | 'payment' | 'custom' | 'customPlaceholder'
  | 'businessName' | 'repName' | 'email' | 'phone' | 'website' | 'instagram'
  | 'industry' | 'message' | 'optional' | 'consentBody' | 'consentCheckbox'
  | 'submit' | 'working',
  string
>;

export function SponsorForm({
  campaignId,
  options,
  labels,
  currencySymbol,
  approvalNote,
}: {
  campaignId: string;
  options: AmountOption[];
  labels: SponsorFormLabels;
  currencySymbol: string;
  approvalNote: string | null;
}) {
  const [state, action] = useActionState<CheckoutState, FormData>(submitSponsorship, {});

  return (
    <form action={action} className="flex flex-col gap-20">
      <input type="hidden" name="campaignId" value={campaignId} />
      <input
        type="text"
        name="company_website_confirm"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <fieldset>
        <legend className="mb-8 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {labels.amount}
        </legend>
        <AmountChooser
          options={options}
          fieldName="packageId"
          customLabel={labels.custom}
          customPlaceholder={labels.customPlaceholder}
          currencySymbol={currencySymbol}
        />
      </fieldset>

      <fieldset>
        <legend className="mb-8 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {labels.business}
        </legend>
        <div className="flex flex-col gap-10">
          <Field label={labels.businessName} name="businessName" required />
          <div className="grid gap-10 md:grid-cols-2">
            <Field label={labels.repName} name="repName" optionalLabel={labels.optional} />
            <Field label={labels.email} name="email" type="email" required inputMode="email" />
          </div>
          <div className="grid gap-10 md:grid-cols-2">
            <Field label={labels.phone} name="phone" type="tel" optionalLabel={labels.optional} />
            <Field label={labels.website} name="website" type="url" optionalLabel={labels.optional} />
          </div>
          <div className="grid gap-10 md:grid-cols-2">
            <Field label={labels.instagram} name="instagram" optionalLabel={labels.optional} />
            <Field label={labels.industry} name="industry" optionalLabel={labels.optional} />
          </div>
          <label className="flex flex-col gap-3">
            <span className="flex items-baseline gap-3">
              <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                {labels.message}
              </span>
              <span className="font-mono text-eyebrow uppercase text-[var(--text-faint)]">
                {labels.optional}
              </span>
            </span>
            <textarea
              name="message"
              rows={4}
              className="w-full resize-none border-b border-[var(--line)] bg-transparent pb-3 text-body text-[var(--text)] transition-colors [transition-duration:var(--duration-signature)] focus:border-[var(--text)] focus:outline-none"
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-8 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {labels.payment}
        </legend>
        <p className="mb-6 max-w-[62ch] text-body text-[var(--text-dim)]">
          {labels.consentBody}
        </p>
        {approvalNote ? (
          <p className="mb-8 max-w-[62ch] font-mono text-eyebrow uppercase text-[var(--text-faint)]">
            {approvalNote}
          </p>
        ) : null}
        <div className="mb-10">
          <CheckField label={labels.consentCheckbox} name="consent" />
        </div>
        <SubmitRow label={labels.submit} workingLabel={labels.working} error={state.error} />
      </fieldset>
    </form>
  );
}
