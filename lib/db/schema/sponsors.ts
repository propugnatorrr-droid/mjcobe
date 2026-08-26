import {
  pgTable, uuid, text, integer, boolean, timestamp, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { moderationState, sponsorBidState } from './enums';
import { campaigns, mediaAssets } from './catalog';

export const sponsorCategories = pgTable('sponsor_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  isProhibited: boolean('is_prohibited').default(false).notNull(),
}, (t) => [uniqueIndex('sponsor_categories_slug_idx').on(t.slug)]);

export const sponsors = pgTable('sponsors', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),
  businessName: text('business_name').notNull(),
  repName: text('rep_name'),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  instagram: text('instagram'),
  shopUrl: text('shop_url'),
  /** SVG required at upload; rendered monochrome knockout so brand palettes
   *  cannot break the site palette. */
  logoAssetId: uuid('logo_asset_id').references(() => mediaAssets.id),
  categoryId: uuid('category_id').references(() => sponsorCategories.id),
  industry: text('industry'),
  description: text('description'),
  message: text('message'),
  moderation: moderationState('moderation').default('pending').notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  supportedSince: timestamp('supported_since', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex('sponsors_slug_idx').on(t.slug)]);

/** A #1 claim attempt. Pending claims are shown publicly — it is dramatic
 *  and it is honest. */
export const sponsorBids = pgTable('sponsor_bids', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  sponsorId: uuid('sponsor_id').references(() => sponsors.id, { onDelete: 'cascade' }).notNull(),
  contributionId: uuid('contribution_id'),
  amountCents: integer('amount_cents').notNull(),
  state: sponsorBidState('state').default('pending').notNull(),
  placedAt: timestamp('placed_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, (t) => [index('sponsor_bids_campaign_idx').on(t.campaignId, t.state)]);

/** Sellable upgrade: sole apparel partner of a record. */
export const exclusivityLocks = pgTable('exclusivity_locks', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => sponsorCategories.id, { onDelete: 'cascade' }).notNull(),
  sponsorId: uuid('sponsor_id').references(() => sponsors.id, { onDelete: 'cascade' }).notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).defaultNow().notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
});

/** 50% visible for 1s, session-deduped — measured, not estimated. */
export const impressions = pgTable('impressions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sponsorId: uuid('sponsor_id').references(() => sponsors.id, { onDelete: 'cascade' }).notNull(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  surface: text('surface').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('impressions_sponsor_idx').on(t.sponsorId, t.occurredAt)]);

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  sponsorId: uuid('sponsor_id').references(() => sponsors.id, { onDelete: 'cascade' }).notNull(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  pdfPath: text('pdf_path'),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
