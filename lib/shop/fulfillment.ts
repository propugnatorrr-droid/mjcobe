import 'server-only';
import { and, eq } from 'drizzle-orm';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';

/**
 * Converts a settled order's reserved stock into a permanent decrement —
 * called from inside lib/commerce/orders.ts's settleOrder() transaction,
 * for `orderType: 'shop'` orders, mirroring exactly how
 * lib/tickets/issue.ts's issueTicketsForOrder() is called for
 * `orderType: 'ticket'`. Decrements `product_variants.stockOnHand` and
 * inserts the `inventory_movements` audit row in the same transaction —
 * never a bare `UPDATE` to stock alone, per the plan's approval
 * correction. Idempotent by construction: checks for an existing 'sale'
 * movement per order item before writing, so a webhook retry (which
 * itself shouldn't reach this far, since settleOrder()'s own settled-
 * state early-return already prevents that) still can't double-decrement.
 *
 * Also creates the order's `fulfillments` row here (status:
 * 'unfulfilled') — an admin needs somewhere to mark shipment regardless
 * of whether every item requires shipping (a mixed digital/physical order
 * isn't modeled in this batch; every product created so far assumes
 * physical goods, matching Batch I's `shippingRequired` default).
 */
export async function commitProductSale(
  tx: Pick<typeof dbw, 'select' | 'insert' | 'update'>,
  orderId: string,
): Promise<void> {
  const items = await tx
    .select()
    .from(s.commerceOrderItems)
    .where(and(eq(s.commerceOrderItems.orderId, orderId), eq(s.commerceOrderItems.itemType, 'product_variant')));

  for (const item of items) {
    const [existingMovement] = await tx
      .select({ id: s.inventoryMovements.id })
      .from(s.inventoryMovements)
      .where(and(eq(s.inventoryMovements.orderItemId, item.id), eq(s.inventoryMovements.reason, 'sale')))
      .limit(1);

    if (existingMovement) continue;

    const [variant] = await tx
      .select({ id: s.productVariants.id, stockOnHand: s.productVariants.stockOnHand, inventoryTracked: s.productVariants.inventoryTracked })
      .from(s.productVariants)
      .where(eq(s.productVariants.id, item.referenceId))
      .limit(1);

    if (!variant) {
      throw new Error(`Product variant ${item.referenceId} no longer exists — cannot commit sale for order item ${item.id}.`);
    }

    if (variant.inventoryTracked) {
      // Not clamped to zero — an oversold variant here would mean the
      // reservation system (lib/shop/reservations.ts) let something
      // through it shouldn't have; surfacing a negative stockOnHand is
      // more honest than silently hiding that bug behind a clamp.
      await tx
        .update(s.productVariants)
        .set({ stockOnHand: variant.stockOnHand - item.quantity })
        .where(eq(s.productVariants.id, variant.id));
    }

    await tx.insert(s.inventoryMovements).values({
      variantId: variant.id,
      delta: -item.quantity,
      reason: 'sale',
      orderItemId: item.id,
    });
  }

  if (items.length > 0) {
    const [existingFulfillment] = await tx.select({ id: s.fulfillments.id }).from(s.fulfillments).where(eq(s.fulfillments.orderId, orderId)).limit(1);
    if (!existingFulfillment) {
      await tx.insert(s.fulfillments).values({ orderId, status: 'unfulfilled' });
    }
  }
}
