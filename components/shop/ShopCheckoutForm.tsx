'use client';

import { useActionState, useState } from 'react';
import { purchaseShopOrder, type ShopCheckoutState } from '@/lib/shop/checkout-actions';
import { CommerceStripeStep, type CommercePaymentLabels } from '@/components/commerce/CommerceStripeStep';

export type ShopCheckoutCopy = {
  emailLabel: string;
  shippingHeading: string;
  recipientNameLabel: string;
  line1Label: string;
  line2Label: string;
  cityLabel: string;
  regionLabel: string;
  postalCodeLabel: string;
  countryLabel: string;
  consentLabel: string;
  submit: string;
  paymentHeading: string;
  paymentLabels: CommercePaymentLabels;
  errorGeneric: string;
  errorEmail: string;
  errorConsent: string;
  errorAddress: string;
  errorSoldOut: string;
  errorUnavailable: string;
  errorDeclined: string;
};

function errorMessage(error: string | undefined, copy: ShopCheckoutCopy): string | null {
  switch (error) {
    case undefined:
      return null;
    case 'email':
      return copy.errorEmail;
    case 'consent':
      return copy.errorConsent;
    case 'address':
      return copy.errorAddress;
    case 'sold_out':
      return copy.errorSoldOut;
    case 'unavailable':
      return copy.errorUnavailable;
    case 'declined':
      return copy.errorDeclined;
    default:
      return copy.errorGeneric;
  }
}

export function ShopCheckoutForm({ needsShipping, copy }: { needsShipping: boolean; copy: ShopCheckoutCopy }) {
  const [state, formAction] = useActionState<ShopCheckoutState, FormData>(purchaseShopOrder, {});
  const [checkoutAttemptKey] = useState(() => crypto.randomUUID());

  if (state.payment) {
    return (
      <CommerceStripeStep
        clientSecret={state.payment.clientSecret}
        returnPath={state.payment.returnPath}
        heading={copy.paymentHeading}
        labels={copy.paymentLabels}
      />
    );
  }

  const error = errorMessage(state.error, copy);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6">
      <input type="hidden" name="checkoutAttemptKey" value={checkoutAttemptKey} />

      {/* Honeypot — CSS-hidden, not JS-hidden, matching lib/checkout/actions.ts's convention. */}
      <div aria-hidden className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label>
          Business website
          <input type="text" name="company_website_confirm" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {copy.emailLabel}
        </span>
        <input
          type="email"
          name="email"
          required
          className="w-full border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
        />
      </label>

      {needsShipping ? (
        <fieldset className="flex flex-col gap-4">
          <legend className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
            {copy.shippingHeading}
          </legend>

          {(
            [
              ['recipientName', copy.recipientNameLabel, true],
              ['line1', copy.line1Label, true],
              ['line2', copy.line2Label, false],
              ['city', copy.cityLabel, true],
              ['region', copy.regionLabel, false],
              ['postalCode', copy.postalCodeLabel, true],
              ['country', copy.countryLabel, true],
            ] as const
          ).map(([name, label, required]) => (
            <label key={name} className="flex flex-col gap-2">
              <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
                {label}
              </span>
              <input
                name={name}
                required={required}
                className="w-full border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
              />
            </label>
          ))}
        </fieldset>
      ) : null}

      <label className="flex items-start gap-3 font-ui text-sm text-[var(--text-dim)]">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-[var(--champagne)]" />
        {copy.consentLabel}
      </label>

      <button type="submit" className="mj-button mj-button--primary w-fit">
        {copy.submit}
      </button>

      {error ? (
        <p className="font-ui text-sm" style={{ color: 'var(--ember)' }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
