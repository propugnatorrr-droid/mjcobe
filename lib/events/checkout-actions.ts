'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { str, bool, normalizeEmail } from '@/lib/checkout/validate';
import { reserveTicketCapacity } from '@/lib/commerce/reservations';
import { createOrder, settleOrder } from '@/lib/commerce/orders';
import { resolveEventCtaState } from '@/lib/events/eligibility';
import { flagEnabled } from '@/lib/config/settings';

export type TicketCheckoutState = {
  error?: string;
  payment?: { clientSecret: string; returnPath: string };
};

const CHECKOUT_ATTEMPT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function checkoutAttemptKey(formData: FormData): string | null {
  const attemptId = str(formData.get('checkoutAttemptKey'), 36);
  if (!attemptId || !CHECKOUT_ATTEMPT_RE.test(attemptId)) return null;
  return `ticket:${attemptId}`;
}

/**
 * Every field here is re-read from the database, never trusted from
 * hidden form inputs — a stale or tampered form must not be able to buy
 * a ticket type that's inactive, sold through a canceled/postponed event,
 * or outside its own sales window. Matches loadPayableCampaign()'s exact
 * discipline in lib/checkout/actions.ts.
 */
async function loadPurchasableTicketType(eventId: string, ticketTypeId: string) {
  const [event] = await db.select().from(s.liveEvents).where(eq(s.liveEvents.id, eventId)).limit(1);
  if (!event) return null;

  const ctaState = resolveEventCtaState(event, new Date());
  if (ctaState !== 'on_sale') return null;

  const [ticketType] = await db
    .select()
    .from(s.ticketTypes)
    .where(eq(s.ticketTypes.id, ticketTypeId))
    .limit(1);

  if (!ticketType || ticketType.eventId !== eventId || !ticketType.isActive) return null;

  const now = Date.now();
  if (ticketType.salesStartAt && ticketType.salesStartAt.getTime() > now) return null;
  if (ticketType.salesEndAt && ticketType.salesEndAt.getTime() <= now) return null;

  return { event, ticketType };
}

export async function purchaseTickets(_prev: TicketCheckoutState, formData: FormData): Promise<TicketCheckoutState> {
  // Honeypot: matches lib/checkout/actions.ts's convention exactly.
  if (str(formData.get('company_website_confirm'))) {
    return { error: 'blocked' };
  }

  if (!(await flagEnabled('ticketSalesEnabled'))) {
    return { error: 'unavailable' };
  }

  const idempotencyKey = checkoutAttemptKey(formData);
  if (!idempotencyKey) return { error: 'generic' };

  const eventId = str(formData.get('eventId'), 100);
  const ticketTypeId = str(formData.get('ticketTypeId'), 100);
  if (!eventId || !ticketTypeId) return { error: 'generic' };

  const quantityRaw = str(formData.get('quantity'), 4);
  const quantity = quantityRaw ? Number(quantityRaw) : NaN;
  if (!Number.isInteger(quantity) || quantity <= 0) return { error: 'quantity' };

  const email = normalizeEmail(formData.get('buyerEmail'));
  if (!email) return { error: 'email' };

  if (!bool(formData.get('consent'))) return { error: 'consent' };

  const purchasable = await loadPurchasableTicketType(eventId, ticketTypeId);
  if (!purchasable) return { error: 'unavailable' };
  const { event, ticketType } = purchasable;

  if (quantity > ticketType.perOrderLimit) {
    return { error: 'limit' };
  }

  const reservation = await reserveTicketCapacity({ ticketTypeId, quantity });
  if (!reservation.ok) {
    return { error: reservation.reason === 'invalid_quantity' ? 'quantity' : 'sold_out' };
  }

  let orderResult: Awaited<ReturnType<typeof createOrder>>;
  try {
    orderResult = await createOrder({
      orderType: 'ticket',
      buyerEmail: email,
      items: [
        {
          itemType: 'ticket_type',
          referenceId: ticketType.id,
          titleSnapshot: `${event.title} — ${ticketType.name}`,
          unitPriceCents: ticketType.priceCents,
          quantity,
        },
      ],
      reservationIds: [reservation.reservationId],
      idempotencyKey,
      description: `Tickets for ${event.title}`,
    });
  } catch {
    return { error: 'generic' };
  }

  if (orderResult.clientSecret) {
    return {
      payment: {
        clientSecret: orderResult.clientSecret,
        returnPath: `/orders/${orderResult.secureToken}`,
      },
    };
  }

  const settled = await settleOrder(orderResult.paymentId);
  if (!settled.ok) {
    return { error: settled.code === 'pending' ? 'generic' : 'declined' };
  }

  redirect(`/orders/${orderResult.secureToken}`);
}
