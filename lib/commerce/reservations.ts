import 'server-only';
import { and, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { reservationDecision } from '@/lib/commerce/reservation-decision';

export type { ReservationCheck, ReservationDecision } from '@/lib/commerce/reservation-decision';
export { reservationDecision } from '@/lib/commerce/reservation-decision';

const RESERVATION_TTL_MINUTES = 20;

export type ReserveResult =
  | { ok: true; reservationId: string }
  | { ok: false; reason: 'invalid_quantity' | 'insufficient_capacity' };

/**
 * Takes a checkout-time-only reservation on a ticket type. Guarded by an
 * advisory lock keyed to the specific ticket type, exactly the same
 * primitive already proven in this codebase for sequential supporter-
 * number issuance (lib/ledger/contributions.ts) — two concurrent requests
 * for the last unit of capacity serialize on this lock, so only one can
 * ever see itself as "available" and insert its reservation row.
 *
 * Called only when server-side checkout actually begins (never on
 * "add to cart" / ticket-type selection) — see the correction this
 * batch's approval added on top of the original architecture plan.
 */
export async function reserveTicketCapacity(input: {
  ticketTypeId: string;
  quantity: number;
}): Promise<ReserveResult> {
  return dbw.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${'ticket_type:' + input.ticketTypeId}))`);

    const [ticketType] = await tx
      .select({ capacity: s.ticketTypes.capacity })
      .from(s.ticketTypes)
      .where(eq(s.ticketTypes.id, input.ticketTypeId))
      .limit(1);

    if (!ticketType) {
      return { ok: false, reason: 'insufficient_capacity' };
    }

    const [activeReservationsRow] = await tx
      .select({ total: sql<number>`coalesce(sum(${s.inventoryReservations.quantity}), 0)` })
      .from(s.inventoryReservations)
      .where(
        and(
          eq(s.inventoryReservations.resourceType, 'ticket_type'),
          eq(s.inventoryReservations.resourceId, input.ticketTypeId),
          gt(s.inventoryReservations.expiresAt, new Date()),
        ),
      );

    // No `tickets` table exists yet (Batch H mints those rows) — until
    // then, a paid order's items are the only durable record that
    // capacity has been permanently claimed. settleOrder() deletes the
    // reservation once an order pays (its "active reservation" slot is no
    // longer needed), so without counting paid order items here, that
    // capacity would silently become available again the moment payment
    // succeeds — a real oversell path, not a hypothetical one.
    //
    // 'partially_refunded' still counts in full: per this initiative's
    // correction on ticket refunds, money and ticket-voiding are never
    // auto-linked — a partial refund settles money without releasing any
    // seat, so its full original quantity still occupies capacity. Only
    // a fully 'refunded' order releases its capacity back.
    const [committedRow] = await tx
      .select({ total: sql<number>`coalesce(sum(${s.commerceOrderItems.quantity}), 0)` })
      .from(s.commerceOrderItems)
      .innerJoin(s.commerceOrders, eq(s.commerceOrders.id, s.commerceOrderItems.orderId))
      .where(
        and(
          eq(s.commerceOrderItems.itemType, 'ticket_type'),
          eq(s.commerceOrderItems.referenceId, input.ticketTypeId),
          inArray(s.commerceOrders.status, ['paid', 'partially_refunded']),
        ),
      );

    const decision = reservationDecision({
      capacity: ticketType.capacity,
      committed: Number(committedRow?.total ?? 0),
      activeReservations: Number(activeReservationsRow?.total ?? 0),
      requestedQuantity: input.quantity,
    });

    if (!decision.ok) {
      return { ok: false, reason: decision.reason === 'invalid_quantity' ? 'invalid_quantity' : 'insufficient_capacity' };
    }

    const [reservation] = await tx
      .insert(s.inventoryReservations)
      .values({
        resourceType: 'ticket_type',
        resourceId: input.ticketTypeId,
        quantity: input.quantity,
        expiresAt: new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000),
      })
      .returning({ id: s.inventoryReservations.id });

    if (!reservation) {
      throw new Error('Reservation row was not created.');
    }

    return { ok: true, reservationId: reservation.id };
  });
}

/** Attaches a reservation to the order that just claimed it — called
 * inside the same transaction as order creation. */
export async function attachReservationToOrder(
  tx: Pick<typeof dbw, 'update'>,
  reservationId: string,
  orderId: string,
): Promise<void> {
  await tx.update(s.inventoryReservations).set({ orderId }).where(eq(s.inventoryReservations.id, reservationId));
}

/**
 * Deletes expired reservation rows. This is a housekeeping sweep, not a
 * correctness requirement — every read of active reservations already
 * filters `expiresAt > now()`, so an expired-but-not-yet-swept row is
 * already treated as absent everywhere it matters. Running this
 * periodically just keeps the table from growing unbounded with dead rows
 * (mirrors the plan's "lightweight cron sweep" recommendation).
 */
export async function sweepExpiredReservations(): Promise<{ deleted: number }> {
  const deleted = await dbw
    .delete(s.inventoryReservations)
    .where(lt(s.inventoryReservations.expiresAt, new Date()))
    .returning({ id: s.inventoryReservations.id });

  return { deleted: deleted.length };
}
