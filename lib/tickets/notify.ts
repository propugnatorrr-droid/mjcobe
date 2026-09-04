import 'server-only';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { deliverNotification } from '@/lib/notifications/outbox';
import { ticketCredential } from '@/lib/tickets/credentials';
import { siteUrl } from '@/lib/email/templates';
import type { TicketOrderConfirmationPayload } from '@/lib/email/templates';

/**
 * Queues and immediately attempts delivery of the ticket confirmation
 * email for a just-settled order — same shape as
 * lib/feed/invites.ts's sendSubmissionInviteEmail() and
 * lib/notifications/outbox.ts's own sendContributionConfirmation():
 * insert into the shared `notifications` table with a dedupe key, then
 * deliver. Called from lib/commerce/orders.ts's settleOrder() outside its
 * transaction, already wrapped in try/catch there — failures here never
 * roll back or misreport a successful payment.
 */
export async function sendTicketOrderConfirmation(orderId: string): Promise<void> {
  const [order] = await db.select().from(s.commerceOrders).where(eq(s.commerceOrders.id, orderId)).limit(1);
  if (!order) return;

  const items = await db.select().from(s.commerceOrderItems).where(eq(s.commerceOrderItems.orderId, orderId));
  const orderItemIds = items.map((i) => i.id);
  if (orderItemIds.length === 0) return;

  const ticketRows = await db.select().from(s.tickets).where(inArray(s.tickets.orderItemId, orderItemIds));
  if (ticketRows.length === 0) return;

  const eventIds = [...new Set(ticketRows.map((t) => t.eventId))];
  const events = await db.select().from(s.liveEvents).where(inArray(s.liveEvents.id, eventIds));
  const eventById = new Map(events.map((e) => [e.id, e]));

  // Multi-event orders aren't possible today (checkout only ever creates
  // a single-event order — see lib/events/checkout-actions.ts), but this
  // reads generically rather than assuming exactly one event.
  const primaryEvent = events[0];
  if (!primaryEvent) return;

  const payload: TicketOrderConfirmationPayload = {
    eventTitle: primaryEvent.title,
    orderNumber: order.orderNumber,
    tickets: ticketRows.map((ticket) => ({
      displayCode: ticket.displayCode,
      ticketUrl: `${siteUrl()}/tickets/${encodeURIComponent(ticketCredential(ticket.id, ticket.credentialVersion))}`,
      eventTitle: eventById.get(ticket.eventId)?.title ?? primaryEvent.title,
    })),
  };

  const dedupeKey = `ticket_order_confirmation:${orderId}`;

  const [created] = await dbw
    .insert(s.notifications)
    .values({
      kind: 'ticket_order_confirmation',
      dedupeKey,
      recipientEmail: order.buyerEmail,
      payload: payload as unknown as Record<string, unknown>,
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
        .where(eq(s.notifications.dedupeKey, dedupeKey))
        .limit(1)
    )[0]?.id;

  if (notificationId) {
    await deliverNotification(notificationId);
  }
}
