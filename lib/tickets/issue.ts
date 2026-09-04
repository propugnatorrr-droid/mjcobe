import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';

const DISPLAY_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // no 0/O/1/I — hand-transcription-safe

function generateDisplayCode(): string {
  const bytes = randomBytes(8);
  let code = '';
  for (const byte of bytes) {
    code += DISPLAY_CODE_ALPHABET[byte % DISPLAY_CODE_ALPHABET.length];
  }
  return code;
}

async function uniqueDisplayCode(tx: Pick<typeof dbw, 'select'>): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = generateDisplayCode();
    const [existing] = await tx.select({ id: s.tickets.id }).from(s.tickets).where(eq(s.tickets.displayCode, candidate)).limit(1);
    if (!existing) return candidate;
  }
  throw new Error('Could not generate a unique ticket display code after 20 attempts.');
}

export type IssuedTicket = { id: string; eventId: string; ticketTypeId: string };

/**
 * Mints one `tickets` row per unit purchased, for every ticket_type line
 * item on a settled order. Called from inside settleOrder()'s own
 * transaction (lib/commerce/orders.ts), so issuance and the order's
 * 'paid' flip are atomic — a reader can never see a paid ticket order with
 * no tickets, or vice versa.
 *
 * Idempotent by construction: checks existing ticket count per order item
 * before minting, so a webhook retry re-running settleOrder() (which
 * itself already early-returns once `commerce_payments.state === 'settled'`)
 * can never double-issue even if this were somehow invoked twice for the
 * same order.
 */
export async function issueTicketsForOrder(
  tx: Pick<typeof dbw, 'select' | 'insert'>,
  orderId: string,
): Promise<IssuedTicket[]> {
  const items = await tx
    .select()
    .from(s.commerceOrderItems)
    .where(and(eq(s.commerceOrderItems.orderId, orderId), eq(s.commerceOrderItems.itemType, 'ticket_type')));

  const issued: IssuedTicket[] = [];

  for (const item of items) {
    const [existingCount] = await tx
      .select({ total: sql<number>`count(*)` })
      .from(s.tickets)
      .where(eq(s.tickets.orderItemId, item.id));

    const alreadyIssued = Number(existingCount?.total ?? 0);
    if (alreadyIssued >= item.quantity) continue;

    const [ticketType] = await tx
      .select({ id: s.ticketTypes.id, eventId: s.ticketTypes.eventId })
      .from(s.ticketTypes)
      .where(eq(s.ticketTypes.id, item.referenceId))
      .limit(1);

    if (!ticketType) {
      // The ticket type was deleted after the order was placed — this
      // shouldn't happen (admin-actions.ts's deleteTicketType has no
      // guard against deleting one with orders yet, a known gap flagged
      // in Batch F's progress notes) but must not silently skip issuance.
      throw new Error(`Ticket type ${item.referenceId} no longer exists — cannot issue tickets for order item ${item.id}.`);
    }

    const toMint = item.quantity - alreadyIssued;

    for (let i = 0; i < toMint; i += 1) {
      const displayCode = await uniqueDisplayCode(tx);

      const [ticket] = await tx
        .insert(s.tickets)
        .values({
          orderItemId: item.id,
          eventId: ticketType.eventId,
          ticketTypeId: ticketType.id,
          displayCode,
          status: 'valid',
        })
        .returning({ id: s.tickets.id, eventId: s.tickets.eventId, ticketTypeId: s.tickets.ticketTypeId });

      if (!ticket) {
        throw new Error('Ticket row was not created.');
      }

      issued.push(ticket);
    }
  }

  return issued;
}
