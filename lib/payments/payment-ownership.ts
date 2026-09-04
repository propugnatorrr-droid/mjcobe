/**
 * Pure classification, split out from lib/payments/webhook-resolver.ts
 * (which is marked 'server-only' and touches the database) so this logic
 * is unit-testable without a database — 'server-only' throws immediately
 * when imported outside the Next.js "react-server" module condition,
 * which is exactly what a Vitest test does. Same split as
 * lib/commerce/reservation-decision.ts.
 *
 * The rule itself: ambiguous ownership (both a campaign transaction and a
 * commerce payment match the same reference) is a hard, logged error —
 * never guessed at, because guessing wrong would mean either crediting a
 * campaign for money that was actually a merch/ticket sale, or the reverse.
 */
export type PaymentDomain =
  | { domain: 'contribution'; transactionId: string }
  | { domain: 'commerce'; paymentId: string; orderId: string }
  | { domain: 'none' };

export function classifyPaymentOwnership(
  providerRef: string,
  transaction: { id: string } | null,
  payment: { id: string; orderId: string } | null,
): PaymentDomain {
  if (transaction && payment) {
    throw new Error(
      `Ambiguous payment ownership: Stripe reference ${providerRef} matches both a campaign transaction (${transaction.id}) and a commerce payment (${payment.id}). Refusing to guess — this must be investigated manually.`,
    );
  }

  if (transaction) return { domain: 'contribution', transactionId: transaction.id };
  if (payment) return { domain: 'commerce', paymentId: payment.id, orderId: payment.orderId };
  return { domain: 'none' };
}
