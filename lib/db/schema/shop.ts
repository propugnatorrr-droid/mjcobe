import {
  pgTable, uuid, text, integer, boolean, timestamp, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { mediaAssets } from './catalog';
import { adminUsers } from './platform';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('draft').notNull(), // draft | active | archived
  productType: text('product_type').default('merch').notNull(),
  featured: boolean('featured').default(false).notNull(),
  sortIndex: integer('sort_index').default(0).notNull(),
  saleStartAt: timestamp('sale_start_at', { withTimezone: true }),
  saleEndAt: timestamp('sale_end_at', { withTimezone: true }),
  shippingRequired: boolean('shipping_required').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('products_slug_idx').on(t.slug),
  index('products_status_idx').on(t.status),
]);

export const productMedia = pgTable('product_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  mediaAssetId: uuid('media_asset_id').references(() => mediaAssets.id).notNull(),
  sortIndex: integer('sort_index').default(0).notNull(),
}, (t) => [
  index('product_media_product_idx').on(t.productId),
]);

/**
 * `stockOnHand` is the single authoritative quantity — per the plan's
 * approval correction, it is updated in the SAME transaction as every
 * `inventory_movements` insert, never purely derived by summing movements
 * at read time. Available stock (once Batch J's reservations exist) is
 * `stockOnHand - activeUnexpiredReservations`, computed on read, mirroring
 * the identical pattern already proven for ticket_types.capacity in
 * lib/commerce/reservations.ts.
 */
export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  sku: text('sku').notNull(),
  name: text('name').notNull(), // 'Large / Black'
  priceCents: integer('price_cents').notNull(),
  compareAtCents: integer('compare_at_cents'),
  stockOnHand: integer('stock_on_hand').default(0).notNull(),
  inventoryTracked: boolean('inventory_tracked').default(true).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortIndex: integer('sort_index').default(0).notNull(),
}, (t) => [
  uniqueIndex('product_variants_sku_idx').on(t.sku),
  index('product_variants_product_idx').on(t.productId),
]);

/** Append-only audit trail for stock adjustments — mirrors ledger_entries'
 * "never mutate, always append" discipline even though this isn't a money
 * table. `product_variants.stockOnHand` is a fast-read cache kept in sync
 * by the same transaction as every insert here, not derived by summing
 * this table at read time — but summing it should always agree with the
 * cache, and does, since every write path updates both atomically. */
export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }).notNull(),
  delta: integer('delta').notNull(), // positive or negative
  reason: text('reason').notNull(), // restock | sale | manual_adjustment | return
  /** Bare uuid, not a `.references()` FK — same cross-schema-file
   * precedent as commerce_order_items.referenceId (avoids an import cycle
   * with commerce.ts once Batch J's checkout writes these on sale). */
  orderItemId: uuid('order_item_id'),
  adminUserId: uuid('admin_user_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  note: text('note'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('inventory_movements_variant_idx').on(t.variantId),
]);
