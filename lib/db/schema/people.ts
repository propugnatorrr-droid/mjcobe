import {
  pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { moderationState, leaderboardScope } from './enums';
import { campaigns, gatedAssets } from './catalog';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  username: text('username'),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  supporterSince: timestamp('supporter_since', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('users_email_idx').on(t.email),
  uniqueIndex('users_username_idx').on(t.username),
]);

/**
 * Public-facing identity. Checkout is guest-first, so a supporter may exist
 * with no user account; emailHash is the join key that lets a later account
 * claim prior contributions.
 */
export const supporters = pgTable('supporters', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  emailHash: text('email_hash').notNull(),
  email: text('email'),
  displayName: text('display_name'),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  instagram: text('instagram'),
  tiktok: text('tiktok'),
  website: text('website'),
  linksPublic: boolean('links_public').default(false).notNull(),
  city: text('city'),
  country: text('country'),
  moderation: moderationState('moderation').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('supporters_email_hash_idx').on(t.emailHash)]);

export const supporterNumbers = pgTable('supporter_numbers', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  contributionId: uuid('contribution_id'),
  seriesKey: text('series_key').notNull(),         // 'supporter' | 'founding'
  number: integer('number').notNull(),
  isReserved: boolean('is_reserved').default(false).notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex('supporter_numbers_unique_idx').on(t.campaignId, t.seriesKey, t.number)]);

export const badges = pgTable('badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull(),
  label: text('label').notNull(),
  description: text('description'),
  isAutomatic: boolean('is_automatic').default(true).notNull(),
  sortIndex: integer('sort_index').default(0).notNull(),
}, (t) => [uniqueIndex('badges_key_idx').on(t.key)]);

export const badgeGrants = pgTable('badge_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  badgeId: uuid('badge_id').references(() => badges.id, { onDelete: 'cascade' }).notNull(),
  supporterId: uuid('supporter_id').references(() => supporters.id, { onDelete: 'cascade' }).notNull(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('badge_grants_supporter_idx').on(t.supporterId),
  /** One grant per badge, per supporter, per campaign. */
  uniqueIndex('badge_grants_unique_idx').on(
    t.badgeId,
    t.supporterId,
    t.campaignId,
  ),
]);

/**
 * Written on every rank recomputation. This is what makes "you held #1 for
 * nine days" answerable, and it is the audit trail for leaderboard disputes.
 */
export const rankSnapshots = pgTable('rank_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  scope: leaderboardScope('scope').notNull(),
  supporterId: uuid('supporter_id').references(() => supporters.id, { onDelete: 'cascade' }),
  sponsorId: uuid('sponsor_id'),
  rank: integer('rank').notNull(),
  amountCents: integer('amount_cents').notNull(),
  capturedAt: timestamp('captured_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('rank_snapshots_campaign_idx').on(t.campaignId, t.scope, t.capturedAt)]);

export const entitlementGrants = pgTable('entitlement_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  supporterId: uuid('supporter_id').references(() => supporters.id, { onDelete: 'cascade' }).notNull(),
  gatedAssetId: uuid('gated_asset_id').references(() => gatedAssets.id, { onDelete: 'cascade' }).notNull(),
  source: text('source').notNull(),                // 'tier' | 'admin'
  grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (t) => [index('entitlement_grants_supporter_idx').on(t.supporterId)]);

export const assetAccessLog = pgTable('asset_access_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  supporterId: uuid('supporter_id').references(() => supporters.id, { onDelete: 'set null' }),
  gatedAssetId: uuid('gated_asset_id').references(() => gatedAssets.id, { onDelete: 'cascade' }).notNull(),
  accessedAt: timestamp('accessed_at', { withTimezone: true }).defaultNow().notNull(),
  ipHash: text('ip_hash'),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),

  supporterId: uuid('supporter_id').references(
    () => supporters.id,
    { onDelete: 'cascade' },
  ),

  sponsorId: uuid('sponsor_id'),

  kind: text('kind').notNull(),

  dedupeKey: text('dedupe_key').notNull(),

  recipientEmail: text('recipient_email'),

  payload: jsonb('payload')
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),

  deliveryStatus: text('delivery_status')
    .default('pending')
    .notNull(),

  attemptCount: integer('attempt_count')
    .default(0)
    .notNull(),

  providerMessageId: text('provider_message_id'),

  lastError: text('last_error'),

  scheduledAt: timestamp('scheduled_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  sentAt: timestamp('sent_at', {
    withTimezone: true,
  }),

  readAt: timestamp('read_at', {
    withTimezone: true,
  }),
}, (t) => [
  uniqueIndex(
    'notifications_dedupe_key_unique_idx',
  ).on(t.dedupeKey),

  index(
    'notifications_delivery_queue_idx',
  ).on(
    t.deliveryStatus,
    t.scheduledAt,
  ),

  index(
    'notifications_supporter_idx',
  ).on(t.supporterId),

  index(
    'notifications_sponsor_idx',
  ).on(t.sponsorId),
]);


/** Guardrails against the outbid loop becoming compulsive. */
export const notificationPrefs = pgTable('notification_prefs', {
  supporterId: uuid('supporter_id').primaryKey().references(() => supporters.id, { onDelete: 'cascade' }),
  competitiveAlerts: boolean('competitive_alerts').default(true).notNull(),
  milestoneAlerts: boolean('milestone_alerts').default(true).notNull(),
  quietHoursStart: integer('quiet_hours_start').default(22).notNull(),
  quietHoursEnd: integer('quiet_hours_end').default(9).notNull(),
});
