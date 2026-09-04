'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { requireAdminRole } from '@/lib/admin/guard';
import { recordAudit } from '@/lib/audit/log';
import { str, bool, slugify, parseAmountCents } from '@/lib/checkout/validate';
import type { AdminState } from '@/lib/admin/actions';

/** Event content/CRUD is a content_admin responsibility, matching the
 * launch role table's "content_admin: ... event content ..." entry. */
const EVENT_ROLES = ['content_admin'] as const;

function revalidateEventSurfaces(slug?: string) {
  revalidatePath('/admin/events');
  revalidatePath('/events');
  revalidatePath('/journey');
  revalidatePath('/', 'layout');
  if (slug) revalidatePath(`/events/${slug}`);
}

function dateFrom(value: FormDataEntryValue | null): Date | null {
  const input = str(value, 40);
  if (!input) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

const EVENT_STATUSES = ['scheduled', 'postponed', 'canceled', 'completed'] as const;

type EventFields = {
  title: string;
  slug: string;
  description: string | null;
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
  salesStartAt: Date | null;
  salesEndAt: Date | null;
  status: (typeof EVENT_STATUSES)[number];
  ticketingEnabled: boolean;
  capacity: number | null;
  cancellationNote: string | null;
  isPublished: boolean;
};

function readEventFields(formData: FormData, fallbackSlug?: string): EventFields | { error: string } {
  const title = str(formData.get('title'), 200);
  const venueName = str(formData.get('venueName'), 200);
  const startsAt = dateFrom(formData.get('startsAt'));
  const timezone = str(formData.get('timezone'), 60);
  if (!title || !venueName || !startsAt || !timezone) return { error: 'missing' };

  const status = str(formData.get('status'), 20) ?? 'scheduled';
  if (!EVENT_STATUSES.includes(status as (typeof EVENT_STATUSES)[number])) {
    return { error: 'invalid_status' };
  }

  const capacityRaw = str(formData.get('capacity'), 10);
  const capacity = capacityRaw ? Number(capacityRaw) : null;
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 0)) {
    return { error: 'invalid_capacity' };
  }

  return {
    title,
    slug: str(formData.get('slug'), 80) || slugify(title) || fallbackSlug || slugify(`event-${Date.now()}`),
    description: str(formData.get('description'), 4000),
    venueName,
    addressLine1: str(formData.get('addressLine1'), 200),
    addressLine2: str(formData.get('addressLine2'), 200),
    city: str(formData.get('city'), 100),
    region: str(formData.get('region'), 100),
    postalCode: str(formData.get('postalCode'), 20),
    country: str(formData.get('country'), 100),
    startsAt,
    endsAt: dateFrom(formData.get('endsAt')),
    timezone,
    salesStartAt: dateFrom(formData.get('salesStartAt')),
    salesEndAt: dateFrom(formData.get('salesEndAt')),
    status: status as (typeof EVENT_STATUSES)[number],
    ticketingEnabled: bool(formData.get('ticketingEnabled')),
    capacity,
    cancellationNote: str(formData.get('cancellationNote'), 1000),
    isPublished: bool(formData.get('isPublished')),
  };
}

export async function createEvent(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...EVENT_ROLES]);

  const fields = readEventFields(formData);
  if ('error' in fields) return fields;

  let slug = fields.slug;
  let attempt = 0;
  while (attempt < 20) {
    const [existing] = await db.select({ id: s.liveEvents.id }).from(s.liveEvents).where(eq(s.liveEvents.slug, slug)).limit(1);
    if (!existing) break;
    attempt += 1;
    slug = `${fields.slug}-${attempt + 1}`;
  }

  const [created] = await dbw
    .insert(s.liveEvents)
    .values({ ...fields, slug })
    .returning({ id: s.liveEvents.id });

  if (!created) return { error: 'failed' };

  await recordAudit({
    adminUserId: me.id,
    action: 'live_event.create',
    entity: 'live_event',
    entityId: created.id,
    after: { title: fields.title, slug, status: fields.status, isPublished: fields.isPublished },
  });

  revalidateEventSurfaces(slug);

  return { ok: 'saved' };
}

export async function updateEvent(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...EVENT_ROLES]);

  const id = str(formData.get('id'), 100);
  if (!id) return { error: 'missing' };

  const [before] = await db.select().from(s.liveEvents).where(eq(s.liveEvents.id, id)).limit(1);
  if (!before) return { error: 'not_found' };

  const fields = readEventFields(formData, before.slug);
  if ('error' in fields) return fields;

  await dbw
    .update(s.liveEvents)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(s.liveEvents.id, id));

  await recordAudit({
    adminUserId: me.id,
    action: 'live_event.update',
    entity: 'live_event',
    entityId: id,
    before: { title: before.title, slug: before.slug, status: before.status, isPublished: before.isPublished },
    after: { title: fields.title, slug: fields.slug, status: fields.status, isPublished: fields.isPublished },
  });

  revalidateEventSurfaces(before.slug);
  if (fields.slug !== before.slug) revalidateEventSurfaces(fields.slug);

  return { ok: 'saved' };
}

// ---------------------------------------------------------- ticket types ----

function readTicketTypeFields(formData: FormData): { name: string; description: string | null; priceCents: number; capacity: number; perOrderLimit: number } | { error: string } {
  const name = str(formData.get('name'), 100);
  const priceCents = parseAmountCents(formData.get('price'));
  const capacityRaw = str(formData.get('capacity'), 10);
  const capacity = capacityRaw ? Number(capacityRaw) : NaN;

  if (!name || priceCents === null || !Number.isInteger(capacity) || capacity < 0) {
    return { error: 'missing' };
  }

  const perOrderLimitRaw = str(formData.get('perOrderLimit'), 10);
  const perOrderLimit = perOrderLimitRaw ? Number(perOrderLimitRaw) : 8;

  return {
    name,
    description: str(formData.get('description'), 500),
    priceCents,
    capacity,
    perOrderLimit: Number.isInteger(perOrderLimit) && perOrderLimit > 0 ? perOrderLimit : 8,
  };
}

export async function createTicketType(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...EVENT_ROLES]);

  const eventId = str(formData.get('eventId'), 100);
  if (!eventId) return { error: 'missing' };

  const fields = readTicketTypeFields(formData);
  if ('error' in fields) return fields;

  const [event] = await db.select({ id: s.liveEvents.id, slug: s.liveEvents.slug }).from(s.liveEvents).where(eq(s.liveEvents.id, eventId)).limit(1);
  if (!event) return { error: 'not_found' };

  const [created] = await dbw
    .insert(s.ticketTypes)
    .values({ ...fields, eventId })
    .returning({ id: s.ticketTypes.id });

  if (!created) return { error: 'failed' };

  await recordAudit({
    adminUserId: me.id,
    action: 'ticket_type.create',
    entity: 'ticket_type',
    entityId: created.id,
    after: { eventId, ...fields },
  });

  revalidateEventSurfaces(event.slug);

  return { ok: 'saved' };
}

export async function updateTicketType(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...EVENT_ROLES]);

  const id = str(formData.get('id'), 100);
  if (!id) return { error: 'missing' };

  const [before] = await db.select().from(s.ticketTypes).where(eq(s.ticketTypes.id, id)).limit(1);
  if (!before) return { error: 'not_found' };

  const fields = readTicketTypeFields(formData);
  if ('error' in fields) return fields;

  const isActive = bool(formData.get('isActive'));

  await dbw
    .update(s.ticketTypes)
    .set({ ...fields, isActive, updatedAt: new Date() })
    .where(eq(s.ticketTypes.id, id));

  const [event] = await db.select({ slug: s.liveEvents.slug }).from(s.liveEvents).where(eq(s.liveEvents.id, before.eventId)).limit(1);

  await recordAudit({
    adminUserId: me.id,
    action: 'ticket_type.update',
    entity: 'ticket_type',
    entityId: id,
    before: { name: before.name, priceCents: before.priceCents, capacity: before.capacity, isActive: before.isActive },
    after: { ...fields, isActive },
  });

  revalidateEventSurfaces(event?.slug);

  return { ok: 'saved' };
}

export async function deleteTicketType(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...EVENT_ROLES]);

  const id = str(formData.get('id'), 100);
  if (!id) return { error: 'missing' };

  const [before] = await db.select().from(s.ticketTypes).where(eq(s.ticketTypes.id, id)).limit(1);
  if (!before) return { error: 'not_found' };

  // No order/ticket table references ticket_types yet (that's Batch G/H) —
  // a hard delete is safe now and will need to become a soft-delete-only
  // guard once real tickets can point at a ticket_type row.
  await dbw.delete(s.ticketTypes).where(eq(s.ticketTypes.id, id));

  const [event] = await db.select({ slug: s.liveEvents.slug }).from(s.liveEvents).where(eq(s.liveEvents.id, before.eventId)).limit(1);

  await recordAudit({
    adminUserId: me.id,
    action: 'ticket_type.delete',
    entity: 'ticket_type',
    entityId: id,
    before: { name: before.name, eventId: before.eventId },
  });

  revalidateEventSurfaces(event?.slug);

  return { ok: 'saved' };
}
