import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { deliverNotification } from '@/lib/notifications/outbox';
import { orderConfirmationToken } from '@/lib/commerce/order-credentials';
import { siteUrl } from '@/lib/email/templates';
import type { ShopOrderConfirmationPayload, ShopShipmentPayload } from '@/lib/email/templates';

/** Same shape as lib/tickets/notify.ts's sendTicketOrderConfirmation() —
 * queue via the shared notifications outbox, deliver immediately, called
 * from lib/commerce/orders.ts's settleOrder() outside its transaction. */
export async function sendShopOrderConfirmation(orderId: string): Promise<void> {
  const [order] = await db.select().from(s.commerceOrders).where(eq(s.commerceOrders.id, orderId)).limit(1);
  if (!order) return;

  const items = await db.select().from(s.commerceOrderItems).where(eq(s.commerceOrderItems.orderId, orderId));
  if (items.length === 0) return;

  const payload: ShopOrderConfirmationPayload = {
    orderNumber: order.orderNumber,
    orderUrl: `${siteUrl()}/orders/${encodeURIComponent(orderConfirmationToken(order.id, order.credentialVersion))}`,
    items: items.map((item) => ({ title: item.titleSnapshot, quantity: item.quantity, lineTotalCents: item.lineTotalCents })),
    totalCents: order.totalCents,
  };

  await queueAndDeliver({
    kind: 'shop_order_confirmation',
    dedupeKey: `shop_order_confirmation:${orderId}`,
    recipientEmail: order.buyerEmail,
    payload: payload as unknown as Record<string, unknown>,
  });
}

export async function sendShopShipmentEmail(orderId: string): Promise<void> {
  const [order] = await db.select().from(s.commerceOrders).where(eq(s.commerceOrders.id, orderId)).limit(1);
  if (!order) return;

  const [fulfillment] = await db.select().from(s.fulfillments).where(eq(s.fulfillments.orderId, orderId)).limit(1);
  if (!fulfillment) return;

  const payload: ShopShipmentPayload = {
    orderNumber: order.orderNumber,
    orderUrl: `${siteUrl()}/orders/${encodeURIComponent(orderConfirmationToken(order.id, order.credentialVersion))}`,
    carrier: fulfillment.carrier,
    trackingNumber: fulfillment.trackingNumber,
  };

  // Distinct dedupe key per shipment event, not per order — unlike the
  // order confirmation (sent once), a shipment email is meant to be
  // resendable/re-triggerable if fulfillment details change, so it keys
  // off the fulfillment row's own updatedAt rather than the static orderId.
  await queueAndDeliver({
    kind: 'shop_shipment',
    dedupeKey: `shop_shipment:${orderId}:${fulfillment.updatedAt.getTime()}`,
    recipientEmail: order.buyerEmail,
    payload: payload as unknown as Record<string, unknown>,
  });
}

async function queueAndDeliver(input: { kind: string; dedupeKey: string; recipientEmail: string; payload: Record<string, unknown> }): Promise<void> {
  const [created] = await dbw
    .insert(s.notifications)
    .values({
      kind: input.kind,
      dedupeKey: input.dedupeKey,
      recipientEmail: input.recipientEmail,
      payload: input.payload,
      deliveryStatus: 'pending',
      scheduledAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning({ id: s.notifications.id });

  const notificationId =
    created?.id ??
    (
      await dbw
        .select({ id: s.notifications.id })
        .from(s.notifications)
        .where(eq(s.notifications.dedupeKey, input.dedupeKey))
        .limit(1)
    )[0]?.id;

  if (notificationId) {
    await deliverNotification(notificationId);
  }
}
