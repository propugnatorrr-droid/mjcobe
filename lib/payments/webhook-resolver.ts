import 'server-only';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { classifyPaymentOwnership } from '@/lib/payments/payment-ownership';

export type { PaymentDomain } from '@/lib/payments/payment-ownership';
export { classifyPaymentOwnership } from '@/lib/payments/payment-ownership';

/**
 * Resolves which domain owns a given payment-provider reference BEFORE
 * any handler touches either table. This is the correction the plan's
 * approval added on top of the original design: the webhook route must
 * not assume every event maps to a `transactions` row (the original
 * design), and must not trust `PaymentIntent.metadata` alone either (some
 * Stripe event types — refunds, disputes, charges — don't carry it the
 * same way a PaymentIntent does). Checking both real tables by their own
 * `providerRef` is the only source of truth.
 */
export async function resolvePaymentDomain(providerRef: string) {
  const [transaction] = await db
    .select({ id: s.transactions.id })
    .from(s.transactions)
    .where(and(eq(s.transactions.provider, 'stripe'), eq(s.transactions.providerRef, providerRef)))
    .limit(1);

  const [payment] = await db
    .select({ id: s.commercePayments.id, orderId: s.commercePayments.orderId })
    .from(s.commercePayments)
    .where(eq(s.commercePayments.providerRef, providerRef))
    .limit(1);

  return classifyPaymentOwnership(providerRef, transaction ?? null, payment ?? null);
}
