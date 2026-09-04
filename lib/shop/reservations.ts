import 'server-only';
import { and, eq, gt, sql } from 'drizzle-orm';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { reservationDecision } from '@/lib/commerce/reservation-decision';

/**
 * Checkout-time-only stock reservation for a product variant — same
 * correction (#2) and same advisory-lock discipline as
 * lib/commerce/reservations.ts's reserveTicketCapacity(), reusing the
 * identical pure `reservationDecision()` function rather than
 * reimplementing the oversell math a second time.
 *
 * Unlike tickets (which had no separate "stock" concept and had to derive
 * `committed` from paid order items), product_variants.stockOnHand IS
 * already the authoritative committed quantity — it's decremented for
 * real the moment an order settles (see lib/shop/fulfillment.ts's
 * commitProductSale(), called from lib/commerce/orders.ts's
 * settleOrder()). So here, `committed` is always 0: the capacity ceiling
 * IS stockOnHand itself, and only *unexpired reservations* need
 * subtracting from it — matching the plan's own stated formula:
 * "available = stockOnHand - activeUnexpiredReservations".
 */
const RESERVATION_TTL_MINUTES = 20;

export type ReserveStockResult =
  | { ok: true; reservationId: string }
  | { ok: false; reason: 'invalid_quantity' | 'insufficient_stock' | 'not_found' };

export async function reserveProductStock(input: { variantId: string; quantity: number }): Promise<ReserveStockResult> {
  return dbw.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${'product_variant:' + input.variantId}))`);

    const [variant] = await tx
      .select({ stockOnHand: s.productVariants.stockOnHand, isActive: s.productVariants.isActive, inventoryTracked: s.productVariants.inventoryTracked })
      .from(s.productVariants)
      .where(eq(s.productVariants.id, input.variantId))
      .limit(1);

    if (!variant || !variant.isActive) {
      return { ok: false, reason: 'not_found' };
    }

    // An untracked variant (made-to-order, no stock ceiling) never needs a
    // reservation at all — grant immediately without touching capacity math.
    if (!variant.inventoryTracked) {
      const [reservation] = await tx
        .insert(s.inventoryReservations)
        .values({
          resourceType: 'product_variant',
          resourceId: input.variantId,
          quantity: input.quantity,
          expiresAt: new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000),
        })
        .returning({ id: s.inventoryReservations.id });
      if (!reservation) throw new Error('Reservation row was not created.');
      return { ok: true, reservationId: reservation.id };
    }

    const [activeReservationsRow] = await tx
      .select({ total: sql<number>`coalesce(sum(${s.inventoryReservations.quantity}), 0)` })
      .from(s.inventoryReservations)
      .where(
        and(
          eq(s.inventoryReservations.resourceType, 'product_variant'),
          eq(s.inventoryReservations.resourceId, input.variantId),
          gt(s.inventoryReservations.expiresAt, new Date()),
        ),
      );

    const decision = reservationDecision({
      capacity: variant.stockOnHand,
      committed: 0,
      activeReservations: Number(activeReservationsRow?.total ?? 0),
      requestedQuantity: input.quantity,
    });

    if (!decision.ok) {
      return { ok: false, reason: decision.reason === 'invalid_quantity' ? 'invalid_quantity' : 'insufficient_stock' };
    }

    const [reservation] = await tx
      .insert(s.inventoryReservations)
      .values({
        resourceType: 'product_variant',
        resourceId: input.variantId,
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
