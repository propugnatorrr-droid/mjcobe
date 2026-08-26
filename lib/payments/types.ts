export type ProviderId = 'mock' | 'stripe' | 'offline';

export type IntentInput = {
  amountCents: number;
  currency: string;
  /** Opaque to the provider; echoed back on the resulting event. */
  metadata: Record<string, string>;
  /** Present only for mock: chooses the simulated outcome. */
  simulateCard?: string;
};

export type IntentResult = {
  intentId: string;
  clientSecret?: string;
  redirectUrl?: string;
};

export type ProviderOutcome =
  | { status: 'succeeded'; providerRef: string }
  | { status: 'pending'; providerRef: string }
  | { status: 'failed'; providerRef: string; code: string; message: string };

export type RefundReasonCode =
  | 'unverified_sponsor' | 'fraud_risk' | 'brand_safety'
  | 'duplicate_payment' | 'customer_request' | 'other';

export interface PaymentProvider {
  readonly id: ProviderId;
  readonly isSimulated: boolean;
  createIntent(input: IntentInput): Promise<IntentResult>;
  /** Authorize → capture. Sponsors above threshold authorize now, capture on approval. */
  capture(intentId: string): Promise<ProviderOutcome>;
  cancel(intentId: string): Promise<ProviderOutcome>;
  refund(intentId: string, amountCents: number, reason: RefundReasonCode): Promise<ProviderOutcome>;
}

/** Magic numbers accepted by the mock provider. */
export const MOCK_CARDS = {
  success: '4242424242424242',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  delayedSettle: '4000000000000259',
} as const;
