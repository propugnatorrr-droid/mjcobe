import 'server-only';
import { randomUUID } from 'node:crypto';
import type { PaymentProvider } from './types';

/**
 * Admin-only. A business wires $20,000 and it must land on the leaderboard
 * exactly like a card payment — same ledger entries, same ranking recompute.
 * There is no external system to call, so every method settles immediately.
 */
export const offlineProvider: PaymentProvider = {
  id: 'offline',
  isSimulated: false,

  async createIntent() {
    return { intentId: `offline_${randomUUID().replace(/-/g, '').slice(0, 20)}` };
  },
  async capture(intentId) {
    return { status: 'succeeded', providerRef: intentId };
  },
  async cancel(intentId) {
    return { status: 'succeeded', providerRef: intentId };
  },
  async refund(intentId) {
    // Reversal happens outside the system; we only record it.
    return { status: 'succeeded', providerRef: `${intentId}_re` };
  },
};
