import {
  pgTable, uuid, text, integer, boolean, timestamp, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { journeyEventKind, milestoneKind, socialFormat } from './enums';
import { campaigns, songs, mediaAssets } from './catalog';

/**
 * One polymorphic event stream. The per-song journey and the global /journey
 * page are both filtered views of this table — nothing is duplicated.
 */
export const journeyEvents = pgTable('journey_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  songId: uuid('song_id').references(() => songs.id, { onDelete: 'cascade' }),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
  kind: journeyEventKind('kind').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  mediaAssetId: uuid('media_asset_id').references(() => mediaAssets.id),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  isAuto: boolean('is_auto').default(true).notNull(),
  isVisible: boolean('is_visible').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('journey_events_occurred_idx').on(t.occurredAt)]);

export const songUpdates = pgTable('song_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  songId: uuid('song_id').references(() => songs.id, { onDelete: 'cascade' }).notNull(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  /** 0 = public. Above 0 gates the update to a minimum tier. */
  minTierCents: integer('min_tier_cents').default(0).notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  isVisible: boolean('is_visible').default(true).notNull(),
});

export const campaignMilestones = pgTable('campaign_milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  kind: milestoneKind('kind').notNull(),
  reachedAt: timestamp('reached_at', { withTimezone: true }),
  graphicAssetId: uuid('graphic_asset_id').references(() => mediaAssets.id),
  isPublished: boolean('is_published').default(false).notNull(),
}, (t) => [uniqueIndex('campaign_milestones_unique_idx').on(t.campaignId, t.kind)]);

export const socialAssets = pgTable('social_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
  contributionId: uuid('contribution_id'),
  sponsorId: uuid('sponsor_id'),
  format: socialFormat('format').notNull(),
  path: text('path').notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Short codes for share graphics. A real page, because it is a growth loop. */
export const shareLinks = pgTable('share_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull(),
  targetPath: text('target_path').notNull(),
  contributionId: uuid('contribution_id'),
  clicks: integer('clicks').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex('share_links_code_idx').on(t.code)]);
