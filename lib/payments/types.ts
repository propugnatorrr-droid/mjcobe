export type ProviderId =
  | 'mock'
  | 'stripe'
  | 'offline';

export type CaptureMethod =
  | 'automatic'
  | 'manual';

export type IntentInput = {
  amountCents: number;
  currency: string;

  /**
   * Opaque to the provider and copied onto the
   * provider-side payment record.
   */
  metadata: Record<
    string,
    string
  >;

  /**
   * Used by the mock provider to choose a
   * simulated outcome.
   */
  simulateCard?: string;

  /**
   * Optional Stripe receipt email.
   */
  customerEmail?: string;

  /**
   * Human-readable description visible in
   * the payment processor dashboard.
   */
  description?: string;

  /**
   * Automatic for ordinary contributions.
   * Manual allows a sponsorship to be
   * authorized and captured after review.
   */
  captureMethod?:
    CaptureMethod;

  /**
   * Provider-side idempotency key. This
   * prevents repeated form submissions from
   * creating multiple payment intents.
   */
  idempotencyKey?: string;
};

export type IntentResult = {
  intentId: string;
  clientSecret?: string;
  redirectUrl?: string;
};

export type ProviderOutcome =
  | {
      status: 'succeeded';
      providerRef: string;
    }
  | {
      status: 'pending';
      providerRef: string;
    }
  | {
      status: 'failed';
      providerRef: string;
      code: string;
      message: string;
    };

export type RefundReasonCode =
  | 'unverified_sponsor'
  | 'fraud_risk'
  | 'brand_safety'
  | 'duplicate_payment'
  | 'customer_request'
  | 'other';

export interface PaymentProvider {
  readonly id: ProviderId;
  readonly isSimulated: boolean;

  createIntent(
    input: IntentInput,
  ): Promise<IntentResult>;

  /**
   * Authorize then capture. Sponsorships
   * above the review threshold may authorize
   * first and capture only after approval.
   */
  capture(
    intentId: string,
  ): Promise<ProviderOutcome>;

  cancel(
    intentId: string,
  ): Promise<ProviderOutcome>;

  refund(
    intentId: string,
    amountCents: number,
    reason: RefundReasonCode,
  ): Promise<ProviderOutcome>;
}

/**
 * Magic card numbers accepted by the mock
 * provider.
 */
export const MOCK_CARDS = {
  success:
    '4242424242424242',
  declined:
    '4000000000000002',
  insufficientFunds:
    '4000000000009995',
  delayedSettle:
    '4000000000000259',
} as const;
