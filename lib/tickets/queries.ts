import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { verifyTicketCredential } from '@/lib/tickets/credentials';

export type PublicTicket = {
  id: string;
  status: string;
  displayCode: string;
  attendeeLabel: string | null;
  eventTitle: string;
  eventSlug: string;
  venueName: string;
  startsAt: Date;
  timezone: string;
};

/**
 * Read-only lookup for /tickets/[secureToken] — verifies the credential,
 * checks the row's current credentialVersion still matches (same
 * discipline as lib/commerce/orders.ts's getOrderBySecureToken), and
 * returns the ticket's public-safe fields. This function never writes;
 * the only two things that ever change a ticket's status are
 * lib/tickets/checkin.ts's redeemTicket() (authenticated) and the
 * reversal/void/reissue admin actions (also authenticated).
 */
export async function getPublicTicketByCredential(rawCredential: string): Promise<PublicTicket | null> {
  const verified = verifyTicketCredential(rawCredential);
  if (!verified) return null;

  const [row] = await db
    .select({
      id: s.tickets.id,
      status: s.tickets.status,
      displayCode: s.tickets.displayCode,
      attendeeLabel: s.tickets.attendeeLabel,
      credentialVersion: s.tickets.credentialVersion,
      eventTitle: s.liveEvents.title,
      eventSlug: s.liveEvents.slug,
      venueName: s.liveEvents.venueName,
      startsAt: s.liveEvents.startsAt,
      timezone: s.liveEvents.timezone,
    })
    .from(s.tickets)
    .innerJoin(s.liveEvents, eq(s.liveEvents.id, s.tickets.eventId))
    .where(eq(s.tickets.id, verified.ticketId))
    .limit(1);

  if (!row) return null;
  if (row.credentialVersion !== verified.credentialVersion) return null;

  return {
    id: row.id,
    status: row.status,
    displayCode: row.displayCode,
    attendeeLabel: row.attendeeLabel,
    eventTitle: row.eventTitle,
    eventSlug: row.eventSlug,
    venueName: row.venueName,
    startsAt: row.startsAt,
    timezone: row.timezone,
  };
}

// --------------------------------------------------------------- admin ----

export type AdminTicketRow = typeof s.tickets.$inferSelect;

export async function listTicketsForEvent(eventId: string): Promise<AdminTicketRow[]> {
  return db.select().from(s.tickets).where(eq(s.tickets.eventId, eventId)).orderBy(desc(s.tickets.issuedAt));
}

export async function getAdminTicket(ticketId: string): Promise<AdminTicketRow | null> {
  const [row] = await db.select().from(s.tickets).where(eq(s.tickets.id, ticketId)).limit(1);
  return row ?? null;
}

export type TicketCheckInLog = typeof s.ticketCheckIns.$inferSelect;

export async function listCheckInHistory(ticketId: string): Promise<TicketCheckInLog[]> {
  return db.select().from(s.ticketCheckIns).where(eq(s.ticketCheckIns.ticketId, ticketId)).orderBy(desc(s.ticketCheckIns.occurredAt));
}
