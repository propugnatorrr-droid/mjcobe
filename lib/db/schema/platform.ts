import {
  pgTable, uuid, text, boolean, timestamp, jsonb, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { adminRole, blocklistKind, moderationState } from './enums';
import { campaigns } from './catalog';

/** DB layer behind config(). File defaults remain the fallback. */
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedByAdminId: uuid('updated_by_admin_id'),
});

/** DB layer behind copy(). Makes "all language is editable" literally true. */
export const siteCopy = pgTable('site_copy', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  note: text('note'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedByAdminId: uuid('updated_by_admin_id'),
});

export const featureFlags = pgTable('feature_flags', {
  key: text('key').primaryKey(),
  enabled: boolean('enabled').default(false).notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  name: text('name'),
  role: adminRole('role').default('super_admin').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex('admin_users_email_idx').on(t.email)]);

/** Immutable. Every admin mutation lands here, no exceptions. */
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminUserId: uuid('admin_user_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  before: jsonb('before'),
  after: jsonb('after'),
  reason: text('reason'),
  ipHash: text('ip_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('audit_log_entity_idx').on(t.entity, t.entityId)]);

export const blocklist = pgTable('blocklist', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: blocklistKind('kind').notNull(),
  value: text('value').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex('blocklist_unique_idx').on(t.kind, t.value)]);

export const moderationQueue = pgTable('moderation_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  entity: text('entity').notNull(),
  entityId: uuid('entity_id').notNull(),
  reason: text('reason').notNull(),
  state: moderationState('state').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

export const referralLinks = pgTable('referral_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }),
  sponsorId: uuid('sponsor_id'),
  label: text('label'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex('referral_links_code_idx').on(t.code)]);

export const referralVisits = pgTable('referral_visits', {
  id: uuid('id').primaryKey().defaultRandom(),
  referralLinkId: uuid('referral_link_id').references(() => referralLinks.id, { onDelete: 'cascade' }).notNull(),
  sessionId: text('session_id').notNull(),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
});

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  source: text('source'),                          // where they signed up, e.g. 'now_page'
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).defaultNow().notNull(),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
}, (t) => [uniqueIndex('newsletter_subscribers_email_idx').on(t.email)]);

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind').notNull(),                    // 'page_view' | 'audio_play' | 'checkout_start'
  songId: uuid('song_id'),
  campaignId: uuid('campaign_id'),
  sessionId: text('session_id').notNull(),
  path: text('path'),
  referrer: text('referrer'),
  meta: jsonb('meta').$type<Record<string, unknown>>().default({}).notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('analytics_events_kind_idx').on(t.kind, t.occurredAt)]);
