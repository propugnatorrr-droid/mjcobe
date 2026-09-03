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

/**
 * An admin-issued, sponsor-bound invitation to submit one feed post.
 * Only `tokenHash` (sha256 of a 32-byte random token) is ever stored — the
 * plaintext exists only transiently, embedded once in the invite email.
 * `sponsorId` is fixed at issuance by the admin who created the invite; the
 * submission route resolves the sponsor from this row alone, never from
 * anything the submitter supplies, so a brand can't post as anyone else.
 * Single-use by default (see `usedAt`) — an admin issues a new invite
 * rather than an invite being reusable across many submissions.
 */
export const brandSubmissionInvites = pgTable('brand_submission_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  sponsorId: uuid('sponsor_id').references(() => sponsors.id, { onDelete: 'cascade' }).notNull(),
  tokenHash: text('token_hash').notNull(),
  createdByAdminId: uuid('created_by_admin_id').references(() => adminUsers.id, { onDelete: 'set null' }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  usedAt: timestamp('used_at', { withTimezone: true }),
  resultingPostId: uuid('resulting_post_id').references(() => brandFeedPosts.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('brand_submission_invites_token_hash_idx').on(t.tokenHash),
  index('brand_submission_invites_sponsor_idx').on(t.sponsorId),
]);

/**
 * A per-attempt record for the public /partners/submit/[secureToken] route
 * — written on every POST (success, validation failure, or rejected
 * token), before any other work happens. This is the rate-limiting surface:
 * the invite token's own entropy (32 random bytes) already makes brute-
 * force guessing infeasible, so this table isn't defending the token's
 * secrecy — it caps how many times a given invite (or a given IP hammering
 * many tokens) can hit the endpoint in a short window, matching the plan's
 * "small counter keyed by token or IP with a time window" guidance without
 * adding a new external dependency.
 */
export const feedSubmissionAttempts = pgTable('feed_submission_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  inviteId: uuid('invite_id').references(() => brandSubmissionInvites.id, { onDelete: 'cascade' }),
  ipHash: text('ip_hash'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('feed_submission_attempts_invite_idx').on(t.inviteId, t.occurredAt),
  index('feed_submission_attempts_ip_idx').on(t.ipHash, t.occurredAt),
]);
