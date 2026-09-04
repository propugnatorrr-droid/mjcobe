/**
 * Pure oversell-prevention math — split out from lib/commerce/
 * reservations.ts (which is marked 'server-only' and touches the
 * database) so this logic can be unit-tested directly without pulling in
 * a database connection, matching this repo's convention (see
 * lib/feed/media-validation.ts / lib/feed/invite-eligibility.ts for the
 * same split, and its own note on why the whole file can't be imported
 * from a Vitest test: 'server-only' throws immediately outside the
 * Next.js "react-server" module condition).
 *
 * `committed` is whatever quantity has already been permanently claimed
 * against capacity outside the reservation system (e.g. issued,
 * non-voided tickets, once Batch H exists — currently sourced from paid
 * commerce_order_items, since nothing mints a permanent `tickets` claim
 * yet). `activeReservations` is the sum of unexpired reservation rows for
 * the same resource. Available capacity is always computed this way,
 * never read from a mutable "remaining" counter.
 */
export type ReservationCheck = {
  capacity: number;
  committed: number;
  activeReservations: number;
  requestedQuantity: number;
};

export type ReservationDecision =
  | { ok: true; availableBeforeRequest: number }
  | { ok: false; reason: 'invalid_quantity' | 'insufficient_capacity'; availableBeforeRequest: number };

export function reservationDecision(input: ReservationCheck): ReservationDecision {
  const availableBeforeRequest = input.capacity - input.committed - input.activeReservations;

  if (!Number.isInteger(input.requestedQuantity) || input.requestedQuantity <= 0) {
    return { ok: false, reason: 'invalid_quantity', availableBeforeRequest };
  }

  if (input.requestedQuantity > availableBeforeRequest) {
    return { ok: false, reason: 'insufficient_capacity', availableBeforeRequest };
  }

  return { ok: true, availableBeforeRequest };
}
