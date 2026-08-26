import {
  pgTable, uuid, text, integer, boolean, timestamp, date, jsonb, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { songStatus, campaignKind, campaignStatus, mediaKind } from './enums';

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: mediaKind('kind').notNull(),
  role: text('role').notNull(),                    // 'hero' | 'portrait' | 'cover' | 'loop' | 'logo'
  path: text('path').notNull(),                    // public/media-relative, never assets/raw
  derivatives: jsonb('derivatives').$type<Record<string, string>>().default({}).notNull(),
  width: integer('width'),
  height: integer('height'),
  durationMs: integer('duration_ms'),
  bytes: integer('bytes'),
  placeholder: text('placeholder'),                // inline base64 AVIF
  dominantColor: text('dominant_color'),
  altCopyKey: text('alt_copy_key'),                // resolves through site_copy
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Generation provenance for a digitally-created artist. Read ONLY from
 * server contexts — prompts and seeds must never reach the client bundle.
 */
export const lookbookAssets = pgTable('lookbook_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaAssetId: uuid('media_asset_id').references(() => mediaAssets.id, { onDelete: 'cascade' }).notNull(),
  concept: text('concept').notNull(),              // e.g. 'beach-neo-noir'
  model: text('model'),
  prompt: text('prompt'),
  seed: text('seed'),
  referenceIds: jsonb('reference_ids').$type<string[]>().default([]).notNull(),
  isReferenceOnly: boolean('is_reference_only').default(false).notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const songs = pgTable('songs', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  status: songStatus('status').default('draft').notNull(),
  coverAssetId: uuid('cover_asset_id').references(() => mediaAssets.id),
  audioAssetId: uuid('audio_asset_id').references(() => mediaAssets.id),
  previewStartMs: integer('preview_start_ms').default(0).notNull(),
  previewEndMs: integer('preview_end_ms').default(30_000).notNull(),
  allowFullPlayback: boolean('allow_full_playback').default(false).notNull(),
  description: text('description'),
  lyrics: text('lyrics'),
  releaseDate: date('release_date'),
  spotifyUrl: text('spotify_url'),
  appleMusicUrl: text('apple_music_url'),
  youtubeUrl: text('youtube_url'),
  musicVideoUrl: text('music_video_url'),
  sortIndex: integer('sort_index').default(0).notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex('songs_slug_idx').on(t.slug)]);

/**
 * Separate from songs (PRD §43): one song may run release, video, remix and
 * tour campaigns over its life without ever being duplicated.
 */
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  songId: uuid('song_id').references(() => songs.id, { onDelete: 'cascade' }).notNull(),
  slug: text('slug').notNull(),
  kind: campaignKind('kind').default('release').notNull(),
  name: text('name').notNull(),
  objective: text('objective'),
  goalCents: integer('goal_cents').notNull(),
  status: campaignStatus('status').default('draft').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  acceptSupport: boolean('accept_support').default(true).notNull(),
  fanSupportEnabled: boolean('fan_support_enabled').default(true).notNull(),
  businessSponsorshipEnabled: boolean('business_sponsorship_enabled').default(true).notNull(),
  /** Null means inherit from global settings. */
  minBidCents: integer('min_bid_cents'),
  minIncrementCents: integer('min_increment_cents'),
  sponsorAutoApprove: boolean('sponsor_auto_approve').default(false).notNull(),
  sponsorApprovalThresholdCents: integer('sponsor_approval_threshold_cents'),
  allocationNote: text('allocation_note'),
  previewSecret: text('preview_secret'),           // draft link for brand pitches
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('campaigns_slug_idx').on(t.slug),
  index('campaigns_song_idx').on(t.songId),
]);

export const supportTiers = pgTable('support_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  amountCents: integer('amount_cents').notNull(),
  description: text('description'),
  benefits: jsonb('benefits').$type<string[]>().default([]).notNull(),
  badgeKey: text('badge_key'),
  quantityLimit: integer('quantity_limit'),        // null = unlimited
  startsAt: timestamp('starts_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  sortIndex: integer('sort_index').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
}, (t) => [index('support_tiers_campaign_idx').on(t.campaignId)]);

export const sponsorPackages = pgTable('sponsor_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  priceCents: integer('price_cents').notNull(),
  deliverables: jsonb('deliverables').$type<string[]>().default([]).notNull(),
  includesBrandedVisual: boolean('includes_branded_visual').default(false).notNull(),
  sortIndex: integer('sort_index').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const gatedAssets = pgTable('gated_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
  mediaAssetId: uuid('media_asset_id').references(() => mediaAssets.id),
  title: text('title').notNull(),
  minTierCents: integer('min_tier_cents').default(0).notNull(),
  isDownloadable: boolean('is_downloadable').default(false).notNull(),
  watermarkPerUser: boolean('watermark_per_user').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
