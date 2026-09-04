'use client';

import { useActionState, useState } from 'react';
import { purchaseTickets, type TicketCheckoutState } from '@/lib/events/checkout-actions';
import { CommerceStripeStep, type CommercePaymentLabels } from '@/components/commerce/CommerceStripeStep';
import type { PublicEvent } from '@/lib/events/queries';

export type TicketCheckoutCopy = {
  ticketTypeLabel: string;
  quantityLabel: string;
  emailLabel: string;
  consentLabel: string;
  submit: string;
  paymentHeading: string;
  paymentLabels: CommercePaymentLabels;
  errorGeneric: string;
  errorEmail: string;
  errorConsent: string;
  errorQuantity: string;
  errorLimit: string;
  errorSoldOut: string;
  errorUnavailable: string;
  errorDeclined: string;
};

function errorMessage(error: string | undefined, copy: TicketCheckoutCopy): string | null {
  switch (error) {
    case undefined:
      return null;
    case 'email':
      return copy.errorEmail;
    case 'consent':
      return copy.errorConsent;
    case 'quantity':
      return copy.errorQuantity;
    case 'limit':
      return copy.errorLimit;
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

export function TicketCheckoutForm({ event, copy }: { event: PublicEvent; copy: TicketCheckoutCopy }) {
  const [state, formAction] = useActionState<TicketCheckoutState, FormData>(purchaseTickets, {});
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
      <input type="hidden" name="eventId" value={event.id} />
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
          {copy.ticketTypeLabel}
        </span>
        <select
          name="ticketTypeId"
          required
          className="w-full border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
        >
          {event.ticketTypes.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {tier.name} — {(tier.priceCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {copy.quantityLabel}
        </span>
        <input
          type="number"
          name="quantity"
          min={1}
          max={8}
          defaultValue={1}
          required
          className="w-32 border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {copy.emailLabel}
        </span>
        <input
          type="email"
          name="buyerEmail"
          required
          className="w-full border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
        />
      </label>

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
