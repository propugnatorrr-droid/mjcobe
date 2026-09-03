import {
  pgTable, uuid, text, timestamp, boolean, integer, jsonb, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { moderationState } from './enums';
import { sponsors } from './sponsors';
import { mediaAssets, songs, campaigns } from './catalog';
import { adminUsers } from './platform';

/**
 * A brand feed post. Public visibility requires BOTH this row's own
 * `moderation === 'approved'` AND the joined sponsor's `moderation ===
 * 'approved'` — a post from a brand later blocked disappears automatically,
 * mirroring how getSponsorProfile()/the leaderboard already double-gate on
 * sponsor state. Post-level moderation is its own column, never a reuse of
 * `sponsors.moderation` — those answer different questions ("is this brand
 * allowed to be public" vs "is this specific post allowed to be public").
 *
 * `relatedLiveEventId` is intentionally not a column yet — the live_events
 * table doesn't exist until a later batch. Add it as a nullable FK then,
 * not a bare uuid now.
 */
export const brandFeedPosts = pgTable('brand_feed_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  sponsorId: uuid('sponsor_id').references(() => sponsors.id, { onDelete: 'cascade' }).notNull(),
  slug: text('slug').notNull(),
  postType: text('post_type').notNull(),          // 'text' | 'image' | 'video' | 'link'
  title: text('title'),
  body: text('body'),
  mediaAssetId: uuid('media_asset_id').references(() => mediaAssets.id),
  ctaLabel: text('cta_label'),
  ctaUrl: text('cta_url'),                          // normalized/protocol-allowlisted before storage, see lib/feed/sanitize.ts
  relatedSongId: uuid('related_song_id').references(() => songs.id, { onDelete: 'set null' }),
  relatedCampaignId: uuid('related_campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  submissionSource: text('submission_source').notNull().default('admin'), // 'admin' | 'brand_invite'
  moderation: moderationState('moderation').notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  rightsAttested: boolean('rights_attested').notNull().default(false),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedByAdminId: uuid('reviewed_by_admin_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  sortPriority: integer('sort_priority').default(0).notNull(),
  /** Snapshot of the submitter's original text/media, taken the first time
   * an admin edits a brand-submitted post — never overwritten again. Null
   * for admin-authored posts (there is no "original" distinct from itself). */
  originalSubmission: jsonb('original_submission').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('brand_feed_posts_slug_idx').on(t.slug),
  index('brand_feed_posts_moderation_published_idx').on(t.moderation, t.publishedAt),
  index('brand_feed_posts_sponsor_idx').on(t.sponsorId),
]);
