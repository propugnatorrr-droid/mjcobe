import {
  pgTable, uuid, text, integer, boolean, timestamp, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { eventStatus } from './enums';
import { mediaAssets } from './catalog';

/**
 * A live event — independent of campaigns/songs, optionally linked *from* a
 * journey entry (see journey_events.liveEventId in content.ts). Ticketing
 * is opt-in per event (`ticketingEnabled`); the event itself, its
 * publication, and its lifecycle status exist regardless of whether
 * tickets are ever sold for it. No payment/order/ticket tables reference
 * this yet — those land in Batches G/H.
 */
export const liveEvents = pgTable('live_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  heroAssetId: uuid('hero_asset_id').references(() => mediaAssets.id),
  venueName: text('venue_name').notNull(),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  city: text('city'),
  region: text('region'),
  postalCode: text('postal_code'),
  country: text('country'),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  /** IANA zone, e.g. 'America/New_York' — used to render the event's own
   * local time regardless of a visitor's browser timezone. */
  timezone: text('timezone').notNull(),
  salesStartAt: timestamp('sales_start_at', { withTimezone: true }),
  salesEndAt: timestamp('sales_end_at', { withTimezone: true }),
  isPublished: boolean('is_published').default(false).notNull(),
  status: eventStatus('status').default('scheduled').notNull(),
  ticketingEnabled: boolean('ticketing_enabled').default(false).notNull(),
  /** Optional venue-level cap, informational only — real capacity
   * enforcement happens per ticket_type once ticketing (Batch G/H) exists. */
  capacity: integer('capacity'),
  cancellationNote: text('cancellation_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('live_events_slug_idx').on(t.slug),
  index('live_events_status_starts_idx').on(t.status, t.startsAt),
]);

/**
 * Ticket tiers for an event. Created and editable now (Batch F) so an
 * event's pricing/capacity can be planned ahead of ticket sales actually
 * going live — but nothing in this batch sells against them. `capacity`
 * here is the one authoritative number Batch H's reservation math will
 * read; no order/reservation table references ticket_types yet.
 */
export const ticketTypes = pgTable('ticket_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => liveEvents.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  priceCents: integer('price_cents').notNull(),
  capacity: integer('capacity').notNull(),
  perOrderLimit: integer('per_order_limit').default(8).notNull(),
  salesStartAt: timestamp('sales_start_at', { withTimezone: true }),
  salesEndAt: timestamp('sales_end_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  sortIndex: integer('sort_index').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('ticket_types_event_idx').on(t.eventId),
]);
