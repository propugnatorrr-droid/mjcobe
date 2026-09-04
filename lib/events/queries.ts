import 'server-only';
import { cache } from 'react';
import { and, asc, desc, eq, gte, inArray, lt } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { resolveEventCtaState, type EventCtaState } from '@/lib/events/eligibility';

export type PublicTicketType = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  isActive: boolean;
};

export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  heroPath: string | null;
  heroPlaceholder: string | null;
  venueName: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  startsAt: Date;
  endsAt: Date | null;
  timezone: string;
  status: string;
  cancellationNote: string | null;
  ctaState: EventCtaState;
  ticketTypes: PublicTicketType[];
};

function publiclyVisibleWhere() {
  return eq(s.liveEvents.isPublished, true);
}

async function attachTicketTypes<T extends { id: string }>(events: T[]): Promise<(T & { ticketTypes: PublicTicketType[] })[]> {
  if (events.length === 0) return [];

  const eventIds = events.map((e) => e.id);
  const rows = await db
    .select({
      id: s.ticketTypes.id,
      eventId: s.ticketTypes.eventId,
      name: s.ticketTypes.name,
      description: s.ticketTypes.description,
      priceCents: s.ticketTypes.priceCents,
      isActive: s.ticketTypes.isActive,
    })
    .from(s.ticketTypes)
    .where(and(inArray(s.ticketTypes.eventId, eventIds), eq(s.ticketTypes.isActive, true)))
    .orderBy(asc(s.ticketTypes.sortIndex), asc(s.ticketTypes.priceCents));

  const byEvent = new Map<string, PublicTicketType[]>();
  for (const row of rows) {
    const list = byEvent.get(row.eventId) ?? [];
    list.push({ id: row.id, name: row.name, description: row.description, priceCents: row.priceCents, isActive: row.isActive });
    byEvent.set(row.eventId, list);
  }

  return events.map((event) => ({ ...event, ticketTypes: byEvent.get(event.id) ?? [] }));
}

function selectPublicColumns() {
  return {
    id: s.liveEvents.id,
    slug: s.liveEvents.slug,
    title: s.liveEvents.title,
    description: s.liveEvents.description,
    heroPath: s.mediaAssets.path,
    heroPlaceholder: s.mediaAssets.placeholder,
    venueName: s.liveEvents.venueName,
    addressLine1: s.liveEvents.addressLine1,
    addressLine2: s.liveEvents.addressLine2,
    city: s.liveEvents.city,
    region: s.liveEvents.region,
    postalCode: s.liveEvents.postalCode,
    country: s.liveEvents.country,
    startsAt: s.liveEvents.startsAt,
    endsAt: s.liveEvents.endsAt,
    timezone: s.liveEvents.timezone,
    status: s.liveEvents.status,
    ticketingEnabled: s.liveEvents.ticketingEnabled,
    salesStartAt: s.liveEvents.salesStartAt,
    salesEndAt: s.liveEvents.salesEndAt,
    cancellationNote: s.liveEvents.cancellationNote,
    isPublished: s.liveEvents.isPublished,
  };
}

function withCtaState<T extends { isPublished: boolean; status: string; ticketingEnabled: boolean; salesStartAt: Date | null; salesEndAt: Date | null }>(
  row: T,
  now: Date,
): T & { ctaState: EventCtaState } {
  return { ...row, ctaState: resolveEventCtaState(row, now) };
}

/** Upcoming published events (startsAt in the future or today), soonest
 * first — the list a visitor actually wants first. Past events are a
 * separate query, not mixed into the same ordering. */
export const listUpcomingEvents = cache(async (): Promise<PublicEvent[]> => {
  const now = new Date();
  const rows = await db
    .select(selectPublicColumns())
    .from(s.liveEvents)
    .leftJoin(s.mediaAssets, eq(s.mediaAssets.id, s.liveEvents.heroAssetId))
    .where(and(publiclyVisibleWhere(), gte(s.liveEvents.startsAt, now)))
    .orderBy(asc(s.liveEvents.startsAt));

  const withCta = rows.map((r) => withCtaState(r, now));
  return attachTicketTypes(withCta);
});

/** Past published events, most recent first — for an archive section. */
export const listPastEvents = cache(async (): Promise<PublicEvent[]> => {
  const now = new Date();
  const rows = await db
    .select(selectPublicColumns())
    .from(s.liveEvents)
    .leftJoin(s.mediaAssets, eq(s.mediaAssets.id, s.liveEvents.heroAssetId))
    .where(and(publiclyVisibleWhere(), lt(s.liveEvents.startsAt, now)))
    .orderBy(desc(s.liveEvents.startsAt));

  const withCta = rows.map((r) => withCtaState(r, now));
  return attachTicketTypes(withCta);
});

export const getPublicEvent = cache(async (slug: string): Promise<PublicEvent | null> => {
  const [row] = await db
    .select(selectPublicColumns())
    .from(s.liveEvents)
    .leftJoin(s.mediaAssets, eq(s.mediaAssets.id, s.liveEvents.heroAssetId))
    .where(and(eq(s.liveEvents.slug, slug), publiclyVisibleWhere()))
    .limit(1);

  if (!row) return null;
  const [withTickets] = await attachTicketTypes([withCtaState(row, new Date())]);
  return withTickets;
});

// --------------------------------------------------------------- admin ----

export type AdminEvent = typeof s.liveEvents.$inferSelect;
export type AdminTicketType = typeof s.ticketTypes.$inferSelect;

export async function listAdminEvents(): Promise<AdminEvent[]> {
  return db.select().from(s.liveEvents).orderBy(desc(s.liveEvents.startsAt));
}

/** Renders in the event's OWN venue timezone, not the site's global
 * displayTimeZone setting — a visitor reading "8:00 PM" for a show in
 * Nashville should see Nashville's 8:00 PM regardless of their own
 * browser's clock or the artist's home-market default. */
export function formatEventDateTime(value: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZone: timezone,
    }).format(value);
  } catch {
    // An admin-entered timezone string that Intl doesn't recognize — fall
    // back to a zone-less rendering rather than throwing on a public page.
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    }).format(value);
  }
}

export async function getAdminEvent(id: string): Promise<{ event: AdminEvent; ticketTypes: AdminTicketType[] } | null> {
  const [event] = await db.select().from(s.liveEvents).where(eq(s.liveEvents.id, id)).limit(1);
  if (!event) return null;

  const ticketTypes = await db
    .select()
    .from(s.ticketTypes)
    .where(eq(s.ticketTypes.eventId, id))
    .orderBy(asc(s.ticketTypes.sortIndex), asc(s.ticketTypes.priceCents));

  return { event, ticketTypes };
}
