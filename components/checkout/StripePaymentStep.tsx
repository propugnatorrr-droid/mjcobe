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
  type StripeError,
} from '@stripe/stripe-js';
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  RotateCcw,
} from 'lucide-react';
import {
  trackAnalytics,
} from '@/components/analytics/AnalyticsEvent';

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

export type StripePaymentLabels = {
  secureBody: string;
  notConfigured: string;
  failed: string;
  declined: string;
  retry: string;
  returnToCheckout: string;
  processing: string;
  doNotClose: string;
};

export type StripePaymentSummary = {
  heading: string;
  recordLabel: string;
  record: string;
  selectionLabel: string;
  selection: string;
  amountLabel: string;
  amount: string;
};


function safeStripeError(
  error: StripeError,
  labels: StripePaymentLabels,
): string {
  const declineCodes = new Set([
    'card_declined',
    'do_not_honor',
    'expired_card',
    'incorrect_cvc',
    'incorrect_number',
    'insufficient_funds',
    'invalid_cvc',
    'lost_card',
    'pickup_card',
    'stolen_card',
  ]);

  if (
    error.decline_code &&
    declineCodes.has(
      error.decline_code,
    )
  ) {
    return labels.declined;
  }

  if (
    error.code &&
    declineCodes.has(
      error.code,
    )
  ) {
    return labels.declined;
  }

  return labels.failed;
}

function StripePaymentForm({
  returnPath,
  checkoutHref,
  heading,
  submitLabel,
  workingLabel,
  campaignId,
  supportType,
  summary,
  labels,
}: {
  returnPath: string;
  checkoutHref: string;
  heading: string;
  submitLabel: string;
  workingLabel: string;
  campaignId: string;
  supportType:
    | 'fan'
    | 'business';
  summary?:
    StripePaymentSummary;
  labels: StripePaymentLabels;
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

    try {
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
        const safeError =
          safeStripeError(
            result.error,
            labels,
          );

        setError(
          safeError,
        );

        trackAnalytics({
          kind:
            'payment_failure',
          campaignId,
          meta: {
            scope:
              supportType,
            reason:
              safeError ===
              labels.declined
                ? 'declined'
                : 'failed',
          },
        });

        setProcessing(false);
        return;
      }

      /*
       * Redirect-required payment methods are
       * handled by Stripe. Cards and other
       * immediate methods arrive here.
       *
       * Settlement remains webhook-backed.
       * The confirmation page does not display
       * supporter benefits until ledger value
       * exists.
       */
      window.location.assign(
        returnPath,
      );
    } catch {
      setError(
        labels.failed,
      );

      trackAnalytics({
        kind:
          'payment_failure',
        campaignId,
        meta: {
          scope:
            supportType,
          reason:
            'unexpected',
        },
      });

      setProcessing(false);
    }
  }

  function retryPayment() {
    setError(null);
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
            {labels.secureBody}
          </p>
        </div>
      </div>

      {summary ? (
        <section
          aria-label={
            summary.heading
          }
          className={[
            'mb-7 overflow-hidden',
            'rounded-[var(--radius-panel)]',
            'border border-[var(--line)]',
            'bg-[var(--panel-soft)]',
          ].join(' ')}
        >
          <p className="border-b border-[var(--line)] px-5 py-3 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
            {summary.heading}
          </p>

          <dl className="divide-y divide-[var(--line)]">
            <div className="flex items-start justify-between gap-5 px-5 py-4">
              <dt className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
                {summary.recordLabel}
              </dt>

              <dd className="text-right font-medium text-[var(--text)]">
                {summary.record}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-5 px-5 py-4">
              <dt className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
                {summary.selectionLabel}
              </dt>

              <dd className="text-right font-medium text-[var(--text)]">
                {summary.selection}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-5 px-5 py-4">
              <dt className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
                {summary.amountLabel}
              </dt>

              <dd className="numeric font-serif text-2xl text-[var(--champagne)]">
                {summary.amount}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      <PaymentElement
        options={{
          layout: {
            type: 'tabs',
            defaultCollapsed:
              false,
          },
        }}
      />


      {processing ? (
        <div
          role="status"
          aria-live="polite"
          className={[
            'mt-6 rounded-[var(--radius-panel)]',
            'border border-[rgba(201,162,39,0.35)]',
            'bg-[rgba(201,162,39,0.07)]',
            'px-4 py-3',
          ].join(' ')}
        >
          <p className="text-sm leading-6 text-[var(--text)]">
            {labels.processing}
          </p>

          <p className="mt-1 text-xs leading-5 text-[var(--text-dim)]">
            {labels.doNotClose}
          </p>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          className={[
            'mt-6 rounded-[var(--radius-panel)]',
            'border border-[rgba(198,93,98,0.5)]',
            'bg-[rgba(198,93,98,0.08)]',
            'px-4 py-4',
          ].join(' ')}
        >
          <p className="text-sm leading-6 text-[var(--status-danger)]">
            {error}
          </p>

          <button
            type="button"
            onClick={retryPayment}
            className={[
              'mt-4 inline-flex min-h-11',
              'items-center justify-center gap-2',
              'rounded-full border',
              'border-[rgba(255,255,255,0.16)]',
              'px-5 py-2',
              'font-ui text-[0.625rem]',
              'font-semibold uppercase',
              'tracking-[0.14em]',
              'text-[var(--text)]',
              'transition-[border-color,color]',
              'hover:border-[var(--champagne)]',
              'hover:text-[var(--champagne)]',
            ].join(' ')}
          >
            <RotateCcw
              aria-hidden
              size={14}
            />

            {labels.retry}
          </button>
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

      <a
        href={checkoutHref}
        className={[
          'mt-4 inline-flex min-h-11 w-full',
          'items-center justify-center gap-2',
          'rounded-full border',
          'border-[var(--line)]',
          'px-6 py-3',
          'font-ui text-[0.625rem]',
          'font-semibold uppercase',
          'tracking-[0.14em]',
          'text-[var(--text-dim)]',
          'transition-[border-color,color]',
          'hover:border-[var(--champagne)]',
          'hover:text-[var(--champagne)]',
        ].join(' ')}
      >
        <ArrowLeft
          aria-hidden
          size={14}
        />

        {labels.returnToCheckout}
      </a>
    </form>
  );
}

export function StripePaymentStep({
  clientSecret,
  returnPath,
  checkoutHref,
  heading,
  submitLabel,
  workingLabel,
  campaignId,
  supportType,
  summary,
  labels,
}: {
  clientSecret: string;
  returnPath: string;
  checkoutHref: string;
  heading: string;
  submitLabel: string;
  workingLabel: string;
  campaignId: string;
  supportType:
    | 'fan'
    | 'business';
  summary?:
    StripePaymentSummary;
  labels: StripePaymentLabels;
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
          'px-5 py-5',
        ].join(' ')}
      >
        <p className="text-sm leading-6 text-[var(--status-danger)]">
          {labels.notConfigured}
        </p>

        <a
          href={checkoutHref}
          className={[
            'mt-4 inline-flex min-h-11',
            'items-center justify-center gap-2',
            'rounded-full border',
            'border-[rgba(255,255,255,0.16)]',
            'px-5 py-2',
            'font-ui text-[0.625rem]',
            'font-semibold uppercase',
            'tracking-[0.14em]',
            'text-[var(--text)]',
            'transition-[border-color,color]',
            'hover:border-[var(--champagne)]',
            'hover:text-[var(--champagne)]',
          ].join(' ')}
        >
          <ArrowLeft
            aria-hidden
            size={14}
          />

          {labels.returnToCheckout}
        </a>
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
        checkoutHref={
          checkoutHref
        }
        heading={heading}
        submitLabel={submitLabel}
        workingLabel={
          workingLabel
        }
        campaignId={
          campaignId
        }
        supportType={
          supportType
        }
        summary={summary}
        labels={labels}
      />
    </Elements>
  );
}
