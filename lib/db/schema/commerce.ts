import {
  pgTable, uuid, text, integer, timestamp, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { paymentProvider } from './enums';

/**
 * The shared order/payment/refund shell for BOTH shop orders (Batch I/J)
 * and ticket orders (Batch G/H), discriminated by `orderType`. This is a
 * deliberately separate schema from `contributions`/`transactions`/
 * `refunds`/`ledger_entries` — nothing in this file, or anything that
 * writes to it, may ever touch those campaign-money tables. That boundary
 * is the single hardest constraint on this whole initiative: a shop or
 * ticket purchase must never look like it moved a campaign's funding
 * meter, affect a supporter/sponsor ranking, or write a ledger_entries row.
 *
 * The *pattern* proven in lib/ledger/contributions.ts is reused here
 * (idempotent creation via the existing idempotency_keys table, advisory-
 * lock-guarded settlement, webhook_events dedup) — the tables are not.
 */
export const commerceOrders = pgTable('commerce_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderType: text('order_type').notNull(), // 'shop' | 'ticket'
  /** Human-readable, shown to the buyer and in admin lists — never used
   * for authorization. */
  orderNumber: text('order_number').notNull(),
  /** The real authorization for /orders/[secureToken] is an HMAC-signed
   * deterministic credential derived from (id, credentialVersion) — see
   * lib/commerce/order-credentials.ts. Nothing is stored beyond this
   * counter; the URL token is recomputed on demand. Bumping it invalidates
   * every previously issued confirmation link at once, which is also how
   * an admin "regenerate the link" action works — no separate revocation
   * list, same pattern as ticket credentials (Batch H). */
  credentialVersion: integer('credential_version').default(0).notNull(),
  buyerEmail: text('buyer_email').notNull(),
  status: text('status').default('pending').notNull(), // pending|paid|failed|canceled|refunded|partially_refunded
  subtotalCents: integer('subtotal_cents').notNull(),
  taxCents: integer('tax_cents').default(0).notNull(),
  shippingCents: integer('shipping_cents').default(0).notNull(),
  discountCents: integer('discount_cents').default(0).notNull(),
  totalCents: integer('total_cents').notNull(),
  currency: text('currency').default('USD').notNull(),
  /** Admin-only, never rendered publicly. */
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('commerce_orders_order_number_idx').on(t.orderNumber),
  index('commerce_orders_status_idx').on(t.status),
]);

export const commerceOrderItems = pgTable('commerce_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => commerceOrders.id, { onDelete: 'cascade' }).notNull(),
  itemType: text('item_type').notNull(), // 'product_variant' | 'ticket_type'
  /**
   * Deliberately a bare uuid, not a `.references()` FK — matching the
   * existing cross-schema-file precedent in money.ts/content.ts/
   * platform.ts (e.g. contributions.sponsorId), so this file doesn't need
   * to import shop.ts (Batch I) or events.ts, avoiding an import cycle.
   * Fulfillment logic must resolve the specific domain table itself
   * (ticket_types now; product_variants once Batch I exists) — this
   * column is display-only.
   */
  referenceId: uuid('reference_id').notNull(),
  /** Immutable snapshot at purchase time — never joined live, so a later
   * edit to the ticket type/product never rewrites order history. */
  titleSnapshot: text('title_snapshot').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  quantity: integer('quantity').notNull(),
  lineTotalCents: integer('line_total_cents').notNull(),
}, (t) => [
  index('commerce_order_items_order_idx').on(t.orderId),
]);

export const commercePayments = pgTable('commerce_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => commerceOrders.id, { onDelete: 'cascade' }).notNull(),
  provider: paymentProvider('provider').notNull(),
  providerRef: text('provider_ref'),
  state: text('state').default('initiated').notNull(), // reuses transactionState's vocabulary at the application layer
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').default('USD').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  settledAt: timestamp('settled_at', { withTimezone: true }),
}, (t) => [
  uniqueIndex('commerce_payments_provider_ref_idx').on(t.providerRef),
  index('commerce_payments_order_idx').on(t.orderId),
]);

export const commerceRefunds = pgTable('commerce_refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').references(() => commercePayments.id, { onDelete: 'cascade' }).notNull(),
  amountCents: integer('amount_cents').notNull(),
  reason: text('reason').notNull(),
  status: text('status').default('creating').notNull(),
  providerRef: text('provider_ref'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('commerce_refunds_provider_ref_idx').on(t.providerRef),
  index('commerce_refunds_payment_idx').on(t.paymentId),
]);

export const orderAddresses = pgTable('order_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => commerceOrders.id, { onDelete: 'cascade' }).notNull(),
  kind: text('kind').notNull(), // 'shipping' | 'billing'
  recipientName: text('recipient_name').notNull(),
  line1: text('line1').notNull(),
  line2: text('line2'),
  city: text('city').notNull(),
  region: text('region'),
  postalCode: text('postal_code').notNull(),
  country: text('country').notNull(),
}, (t) => [
  index('order_addresses_order_idx').on(t.orderId),
]);

/**
 * A hold on capacity/stock, created only at checkout time (never on "add
 * to cart") — see lib/commerce/reservations.ts for the locking discipline
 * that makes this oversell-safe. `orderId` is null until the order it
 * belongs to actually gets created (same transaction), and a reservation
 * with a past `expiresAt` is treated as absent on every read regardless of
 * whether the sweep cron has run yet.
 */
export const inventoryReservations = pgTable('inventory_reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  resourceType: text('resource_type').notNull(), // 'ticket_type' | 'product_variant'
  resourceId: uuid('resource_id').notNull(),
  quantity: integer('quantity').notNull(),
  orderId: uuid('order_id').references(() => commerceOrders.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('inventory_reservations_resource_idx').on(t.resourceType, t.resourceId, t.expiresAt),
]);
