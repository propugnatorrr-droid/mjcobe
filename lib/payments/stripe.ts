import 'server-only';
import type { PaymentProvider } from './types';

/**
 * Go-live adapter. Implement against Stripe Payment Intents and map its
 * results onto ProviderOutcome. Nothing outside this file changes when it
 * lands — that is the entire reason the interface exists.
 */
export const stripeProvider: PaymentProvider = {
  id: 'stripe',
  isSimulated: false,
  async createIntent() { throw new Error('Stripe provider not yet implemented. Set PAYMENTS_PROVIDER=mock.'); },
  async capture() { throw new Error('Stripe provider not yet implemented.'); },
  async cancel() { throw new Error('Stripe provider not yet implemented.'); },
  async refund() { throw new Error('Stripe provider not yet implemented.'); },
};
