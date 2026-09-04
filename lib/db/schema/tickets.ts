import {
  pgTable, uuid, text, integer, timestamp, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { commerceOrderItems } from './commerce';
import { liveEvents, ticketTypes } from './events';
import { adminUsers } from './platform';

/**
 * One admission credential — one row per unit purchased, not per order.
 * The actual bearer credential (QR payload / URL token) is an HMAC-signed
 * deterministic value derived from `(id, credentialVersion)` — see
 * lib/tickets/credentials.ts — nothing resembling a token or its hash is
 * stored here. `credentialVersion` bump = "regenerate the QR without
 * changing who holds the ticket" (lost email, leaked screenshot); a full
 * `reissue` mints an entirely new row and voids this one (see
 * lib/tickets/checkin.ts) for "buyer needs a completely fresh credential".
 *
 * `status` is the single source of truth for redemption state — no
 * separate mutable "used" flag anywhere else. The only two ways it
 * changes are the authenticated check-in route and an authenticated
 * admin void/reversal/reissue action; no public endpoint can ever write
 * to this column.
 */
export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderItemId: uuid('order_item_id').references(() => commerceOrderItems.id, { onDelete: 'cascade' }).notNull(),
  eventId: uuid('event_id').references(() => liveEvents.id).notNull(),
  ticketTypeId: uuid('ticket_type_id').references(() => ticketTypes.id).notNull(),
  credentialVersion: integer('credential_version').default(0).notNull(),
  /** Short human-readable fallback for manual staff entry when a QR can't
   * be scanned. Not a security boundary on its own — see
   * lib/tickets/checkin.ts's header comment on why that's fine (redemption
   * is gated by staff authentication, not by this code's secrecy). */
  displayCode: text('display_code').notNull(),
  attendeeLabel: text('attendee_label'),
  status: text('status').default('valid').notNull(), // valid | checked_in | void
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
  checkedInByAdminId: uuid('checked_in_by_admin_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  voidReason: text('void_reason'),
}, (t) => [
  uniqueIndex('tickets_display_code_idx').on(t.displayCode),
  index('tickets_event_status_idx').on(t.eventId, t.status),
  index('tickets_order_item_idx').on(t.orderItemId),
]);

/** Append-only audit trail for redemption-adjacent events — separate from
 * the generic audit_log because these are frequent, staff-scanner-driven
 * mutations, not admin-console form submissions. Never mutated or deleted. */
export const ticketCheckIns = pgTable('ticket_check_ins', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').references(() => tickets.id, { onDelete: 'cascade' }).notNull(),
  action: text('action').notNull(), // check_in | reversal | void | reissue
  adminUserId: uuid('admin_user_id').references(() => adminUsers.id).notNull(),
  reason: text('reason'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('ticket_check_ins_ticket_idx').on(t.ticketId),
]);
