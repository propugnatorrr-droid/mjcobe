'use client';

import {
  useState,
  type FormEvent,
} from 'react';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import {
  loadStripe,
  type Appearance,
} from '@stripe/stripe-js';
import {
  ArrowRight,
  LockKeyhole,
} from 'lucide-react';

const publishableKey =
  process.env
    .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const stripePromise =
  publishableKey
    ? loadStripe(
        publishableKey,
      )
    : null;

const appearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary:
      '#c9a227',
    colorBackground:
      '#101010',
    colorText:
      '#f5f1e8',
    colorDanger:
      '#c65d62',
    colorTextSecondary:
      '#aaa49a',
    borderRadius:
      '8px',
    fontFamily:
      'Arial, sans-serif',
    spacingUnit:
      '4px',
  },
  rules: {
    '.Input': {
      border:
        '1px solid rgba(255,255,255,0.14)',
      boxShadow: 'none',
    },
    '.Input:focus': {
      border:
        '1px solid #c9a227',
      boxShadow:
        '0 0 0 2px rgba(201,162,39,0.16)',
    },
    '.Label': {
      color:
        '#aaa49a',
      fontSize: '12px',
      fontWeight: '600',
      letterSpacing:
        '0.08em',
      textTransform:
        'uppercase',
    },
  },
};

function StripePaymentForm({
  returnPath,
  heading,
  submitLabel,
  workingLabel,
}: {
  returnPath: string;
  heading: string;
  submitLabel: string;
  workingLabel: string;
}) {
  const stripe =
    useStripe();

  const elements =
    useElements();

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !stripe ||
      !elements ||
      processing
    ) {
      return;
    }

    setProcessing(true);
    setError(null);

    const returnUrl =
      new URL(
        returnPath,
        window.location.origin,
      ).toString();

    const result =
      await stripe
        .confirmPayment({
          elements,
          confirmParams: {
            return_url:
              returnUrl,
          },
          redirect:
            'if_required',
        });

    if (result.error) {
      setError(
        result.error.message ??
          'The payment could not be completed.',
      );

      setProcessing(false);
      return;
    }

    /*
     * Redirect-required payment methods are
     * handled by Stripe. Cards and other
     * immediate methods reach this branch.
     * Settlement remains webhook-backed.
     */
    window.location.assign(
      returnPath,
    );
  }

  return (
    <form
      onSubmit={submit}
className={[
  'checkout-v3-stripe',
  'mx-auto w-full max-w-2xl',
  'rounded-[var(--radius-panel)]',
  'border border-[rgba(201,162,39,0.42)]',
  'bg-[var(--ink-2)] p-5',
  'shadow-[var(--shadow-panel)]',
  'sm:p-8',
].join(' ')}
    >
      <div className="mb-7 flex items-start gap-4">
        <span
          className={[
            'flex h-10 w-10 shrink-0',
            'items-center justify-center',
            'rounded-full',
            'bg-[rgba(201,162,39,0.12)]',
          ].join(' ')}
        >
          <LockKeyhole
            aria-hidden
            size={18}
            color="var(--champagne)"
          />
        </span>

        <div>
          <h2 className="font-display text-2xl uppercase tracking-[0.08em] text-[var(--text)]">
            {heading}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
            Your payment details are
            securely collected and
            processed by Stripe.
          </p>
        </div>
      </div>

      <PaymentElement
        options={{
          layout: {
            type: 'tabs',
            defaultCollapsed:
              false,
          },
        }}
      />

      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          className={[
            'mt-6 rounded-[var(--radius-panel)]',
            'border border-[rgba(198,93,98,0.5)]',
            'bg-[rgba(198,93,98,0.08)]',
            'px-4 py-3',
          ].join(' ')}
        >
          <p className="text-sm leading-6 text-[var(--status-danger)]">
            {error}
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={
          processing ||
          !stripe ||
          !elements
        }
        aria-disabled={
          processing ||
          !stripe ||
          !elements
        }
        className={[
          'bg-gold mt-7',
          'inline-flex min-h-14 w-full',
          'items-center justify-center gap-3',
          'rounded-full px-8 py-4',
          'font-ui text-xs font-semibold',
          'uppercase tracking-[0.14em]',
          'text-[var(--ink)]',
          'transition-[filter,transform,opacity]',
          '[transition-duration:var(--duration-signature)]',
          '[transition-timing-function:var(--ease-signature)]',
          'hover:brightness-110',
          'active:translate-y-px',
          'disabled:cursor-not-allowed',
          'disabled:opacity-50',
        ].join(' ')}
        style={{
          boxShadow:
            'var(--glow-champagne)',
        }}
      >
        <span>
          {processing
            ? workingLabel
            : submitLabel}
        </span>

        <ArrowRight
          aria-hidden
          size={16}
        />
      </button>
    </form>
  );
}

export function StripePaymentStep({
  clientSecret,
  returnPath,
  heading,
  submitLabel,
  workingLabel,
}: {
  clientSecret: string;
  returnPath: string;
  heading: string;
  submitLabel: string;
  workingLabel: string;
}) {
  if (
    !stripePromise ||
    !publishableKey
  ) {
    return (
      <div
        role="alert"
className={[
  'checkout-v3-stripe',
  'mx-auto w-full max-w-2xl',
  'rounded-[var(--radius-panel)]',
  'border border-[rgba(198,93,98,0.5)]',
  'bg-[rgba(198,93,98,0.08)]',
  'px-5 py-4',
].join(' ')}
      >
        <p className="text-sm leading-6 text-[var(--status-danger)]">
          Secure payment is not
          configured. No charge was
          made.
        </p>
      </div>
    );
  }

  return (
    <Elements
      key={clientSecret}
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance,
        loader: 'auto',
      }}
    >
      <StripePaymentForm
        returnPath={returnPath}
        heading={heading}
        submitLabel={submitLabel}
        workingLabel={
          workingLabel
        }
      />
    </Elements>
  );
}
