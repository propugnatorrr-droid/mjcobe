'use client';

import { useState, type FormEvent } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Appearance, type StripeError } from '@stripe/stripe-js';
import { ArrowRight, LockKeyhole, RotateCcw } from 'lucide-react';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

// Same visual language as components/checkout/StripePaymentStep.tsx — this
// is a separate, leaner component (not a reuse of that one) because that
// component's failure-tracking hard-requires a campaignId/supportType for
// its analytics call, neither of which exists for a commerce order.
const appearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#c9a227',
    colorBackground: '#101010',
    colorText: '#f5f1e8',
    colorDanger: '#c65d62',
    colorTextSecondary: '#aaa49a',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid rgba(255,255,255,0.14)', boxShadow: 'none' },
    '.Input:focus': { border: '1px solid #c9a227', boxShadow: '0 0 0 2px rgba(201,162,39,0.16)' },
    '.Label': { color: '#aaa49a', fontSize: '12px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' },
  },
};

export type CommercePaymentLabels = {
  secureBody: string;
  notConfigured: string;
  failed: string;
  declined: string;
  retry: string;
  processing: string;
  doNotClose: string;
  submit: string;
  working: string;
};

function safeStripeError(error: StripeError, labels: CommercePaymentLabels): string {
  const declineCodes = new Set([
    'card_declined', 'do_not_honor', 'expired_card', 'incorrect_cvc', 'incorrect_number',
    'insufficient_funds', 'invalid_cvc', 'lost_card', 'pickup_card', 'stolen_card',
  ]);
  if (error.decline_code && declineCodes.has(error.decline_code)) return labels.declined;
  if (error.code && declineCodes.has(error.code)) return labels.failed;
  return labels.failed;
}

function CommerceStripeForm({
  returnPath,
  heading,
  labels,
}: {
  returnPath: string;
  heading: string;
  labels: CommercePaymentLabels;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || processing) return;

    setProcessing(true);
    setError(null);

    const returnUrl = new URL(returnPath, window.location.origin).toString();

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(safeStripeError(result.error, labels));
        setProcessing(false);
        return;
      }

      // Settlement remains webhook-backed, same as the campaign checkout
      // flow — the confirmation page does not show a paid state until the
      // order's own status reflects it.
      window.location.assign(returnPath);
    } catch {
      setError(labels.failed);
      setProcessing(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-2xl rounded-[var(--radius-panel)] border border-[rgba(201,162,39,0.42)] bg-[var(--ink-2)] p-5 shadow-[var(--shadow-panel)] sm:p-8"
    >
      <div className="mb-7 flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(201,162,39,0.12)]">
          <LockKeyhole aria-hidden size={18} color="var(--champagne)" />
        </span>
        <div>
          <h2 className="font-display text-2xl uppercase tracking-[0.08em] text-[var(--text)]">{heading}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{labels.secureBody}</p>
        </div>
      </div>

      <PaymentElement options={{ layout: { type: 'tabs', defaultCollapsed: false } }} />

      {processing ? (
        <div role="status" aria-live="polite" className="mt-6 rounded-[var(--radius-panel)] border border-[rgba(201,162,39,0.35)] bg-[rgba(201,162,39,0.07)] px-4 py-3">
          <p className="text-sm leading-6 text-[var(--text)]">{labels.processing}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-dim)]">{labels.doNotClose}</p>
        </div>
      ) : null}

      {error ? (
        <div role="alert" aria-live="assertive" className="mt-6 rounded-[var(--radius-panel)] border border-[rgba(198,93,98,0.5)] bg-[rgba(198,93,98,0.08)] px-4 py-4">
          <p className="text-sm leading-6 text-[var(--status-danger)]">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[rgba(255,255,255,0.16)] px-5 py-2 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text)] transition-[border-color,color] hover:border-[var(--champagne)] hover:text-[var(--champagne)]"
          >
            <RotateCcw aria-hidden size={14} />
            {labels.retry}
          </button>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={processing || !stripe || !elements}
        aria-disabled={processing || !stripe || !elements}
        className="bg-gold mt-7 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full px-8 py-4 font-ui text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink)] transition-[filter,transform,opacity] [transition-duration:var(--duration-signature)] hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
        style={{ boxShadow: 'var(--glow-champagne)' }}
      >
        <span>{processing ? labels.working : labels.submit}</span>
        <ArrowRight aria-hidden size={16} />
      </button>
    </form>
  );
}

export function CommerceStripeStep({
  clientSecret,
  returnPath,
  heading,
  labels,
}: {
  clientSecret: string;
  returnPath: string;
  heading: string;
  labels: CommercePaymentLabels;
}) {
  if (!stripePromise || !publishableKey) {
    return (
      <div role="alert" className="mx-auto w-full max-w-2xl rounded-[var(--radius-panel)] border border-[rgba(198,93,98,0.5)] bg-[rgba(198,93,98,0.08)] px-5 py-5">
        <p className="text-sm leading-6 text-[var(--status-danger)]">{labels.notConfigured}</p>
      </div>
    );
  }

  return (
    <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret, appearance, loader: 'auto' }}>
      <CommerceStripeForm returnPath={returnPath} heading={heading} labels={labels} />
    </Elements>
  );
}
