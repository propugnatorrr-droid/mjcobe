import 'server-only';
import { randomUUID } from 'node:crypto';
import type { PaymentProvider, IntentInput, IntentResult, ProviderOutcome } from './types';
import { MOCK_CARDS } from './types';

/**
 * Runs the real flow end to end without a processor. It emits the same
 * outcomes the Stripe adapter will, so every downstream system — ledger,
 * ranking, supporter numbers, email — is exercised for real before payments
 * are live. Nothing here is a placeholder that gets rewritten later.
 */
const intents = new Map<string, { amountCents: number; card: string; captured: boolean }>();

function outcomeFor(card: string, ref: string): ProviderOutcome {
  switch (card) {
    case MOCK_CARDS.declined:
      return { status: 'failed', providerRef: ref, code: 'card_declined', message: 'Your card was declined.' };
    case MOCK_CARDS.insufficientFunds:
      return { status: 'failed', providerRef: ref, code: 'insufficient_funds', message: 'Insufficient funds.' };
    case MOCK_CARDS.delayedSettle:
      return { status: 'pending', providerRef: ref };
    default:
      return { status: 'succeeded', providerRef: ref };
  }
}

export const mockProvider: PaymentProvider = {
  id: 'mock',
  isSimulated: true,

  async createIntent(input: IntentInput): Promise<IntentResult> {
    const intentId = `mock_pi_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
    intents.set(intentId, {
      amountCents: input.amountCents,
      card: input.simulateCard ?? MOCK_CARDS.success,
      captured: false,
    });
    return { intentId, clientSecret: `${intentId}_secret` };
  },

  async capture(intentId) {
    const intent = intents.get(intentId);
    if (!intent) return { status: 'failed', providerRef: intentId, code: 'no_such_intent', message: 'Unknown intent.' };
    const result = outcomeFor(intent.card, intentId);
    if (result.status === 'succeeded') intent.captured = true;
    return result;
  },

  async cancel(intentId) {
    intents.delete(intentId);
    return { status: 'succeeded', providerRef: intentId };
  },

  async refund(intentId, amountCents) {
    const intent = intents.get(intentId);
    if (!intent) return { status: 'failed', providerRef: intentId, code: 'no_such_intent', message: 'Unknown intent.' };
    if (amountCents > intent.amountCents) {
      return { status: 'failed', providerRef: intentId, code: 'amount_too_large', message: 'Refund exceeds charge.' };
    }
    return { status: 'succeeded', providerRef: `${intentId}_re` };
  },
};
