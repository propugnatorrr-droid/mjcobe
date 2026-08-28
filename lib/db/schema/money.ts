import {
  pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import {
  supportType, transactionState, paymentProvider, offlineMethod,
  ledgerKind, refundReason, moderationState, invoiceStatus,
} from './enums';
import { campaigns, songs, supportTiers } from './catalog';
import { supporters } from './people';

export const contributions = pgTable('contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  songId: uuid('song_id').references(() => songs.id, { onDelete: 'cascade' }).notNull(),
  supporterId: uuid('supporter_id').references(() => supporters.id, { onDelete: 'set null' }),
  sponsorId: uuid('sponsor_id'),
  supportType: supportType('support_type').notNull(),
  tierId: uuid('tier_id').references(() => supportTiers.id, { onDelete: 'set null' }),
  amountCents: integer('amount_cents').notNull(),
  /** Snapshot: renaming a supporter must not silently rewrite history. */
  displayNameSnapshot: text('display_name_snapshot'),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  leaderboardVisible: boolean('leaderboard_visible').default(true).notNull(),
  hideAmount: boolean('hide_amount').default(false).notNull(),
  moderation: moderationState('moderation').default('pending').notNull(),
  referralLinkId: uuid('referral_link_id'),
  isTest: boolean('is_test').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('contributions_campaign_idx').on(t.campaignId, t.supportType),
  index('contributions_supporter_idx').on(t.supporterId),
]);

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  contributionId: uuid('contribution_id').references(() => contributions.id, { onDelete: 'cascade' }).notNull(),
  provider: paymentProvider('provider').notNull(),
  providerRef: text('provider_ref'),
  state: transactionState('state').default('initiated').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').default('USD').notNull(),
  offlineMethod: offlineMethod('offline_method'),
  failureCode: text('failure_code'),
  isTest: boolean('is_test').default(false).notNull(),
  authorizedAt: timestamp('authorized_at', { withTimezone: true }),
  capturedAt: timestamp('captured_at', { withTimezone: true }),
  settledAt: timestamp('settled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('transactions_state_idx').on(t.state)]);

export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id')
    .references(
      () => transactions.id,
      {
        onDelete: 'cascade',
      },
    )
    .notNull(),
  amountCents: integer('amount_cents')
    .notNull(),
  reason: refundReason('reason')
    .notNull(),
  note: text('note'),
  adminUserId: uuid('admin_user_id'),
  providerRef: text('provider_ref'),
  status: text('status')
    .default('succeeded')
    .notNull(),
  failureReason:
    text('failure_reason'),
  createdAt: timestamp(
    'created_at',
    {
      withTimezone: true,
    },
  )
    .defaultNow()
    .notNull(),
  updatedAt: timestamp(
    'updated_at',
    {
      withTimezone: true,
    },
  )
    .defaultNow()
    .notNull(),
}, (t) => [
  uniqueIndex(
    'refunds_provider_ref_unique_idx',
  ).on(t.providerRef),
]);

/**
 * Append-only. Never UPDATE or DELETE a
 * row here. Every total in the product is
 * SUM(amount_cents) over this table.
 */
export const ledgerEntries = pgTable('ledger_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .references(
      () => campaigns.id,
      {
        onDelete: 'cascade',
      },
    )
    .notNull(),
  contributionId: uuid('contribution_id')
    .references(
      () => contributions.id,
      {
        onDelete: 'cascade',
      },
    )
    .notNull(),
  transactionId: uuid('transaction_id')
    .references(
      () => transactions.id,
      {
        onDelete: 'set null',
      },
    ),
  refundId: uuid('refund_id')
    .references(
      () => refunds.id,
      {
        onDelete: 'set null',
      },
    ),
  supporterId: uuid('supporter_id')
    .references(
      () => supporters.id,
      {
        onDelete: 'set null',
      },
    ),
  sponsorId: uuid('sponsor_id'),

  /**
   * Contributions are positive. Refunds
   * and chargebacks are negative.
   * Reinstatements are positive
   * adjustments.
   */
  kind: ledgerKind('kind').notNull(),
  amountCents:
    integer('amount_cents').notNull(),
  note: text('note'),

  /**
   * Deterministic provider movement key.
   * This prevents duplicate refund or
   * dispute ledger entries during webhook
   * retries.
   */
  externalRef: text('external_ref'),

  occurredAt: timestamp(
    'occurred_at',
    {
      withTimezone: true,
    },
  )
    .defaultNow()
    .notNull(),
}, (t) => [
  index(
    'ledger_campaign_idx',
  ).on(t.campaignId),

  index(
    'ledger_supporter_idx',
  ).on(t.supporterId),

  index(
    'ledger_refund_idx',
  ).on(t.refundId),

  uniqueIndex(
    'ledger_external_ref_unique_idx',
  ).on(t.externalRef),
]);

export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id')
    .references(
      () => transactions.id,
      {
        onDelete: 'cascade',
      },
    )
    .notNull(),
  providerRef: text('provider_ref'),
  amountCents:
    integer('amount_cents').notNull(),
  state: text('state').notNull(),
  openedAt: timestamp(
    'opened_at',
    {
      withTimezone: true,
    },
  )
    .defaultNow()
    .notNull(),
  resolvedAt: timestamp(
    'resolved_at',
    {
      withTimezone: true,
    },
  ),
}, (t) => [
  uniqueIndex(
    'disputes_provider_ref_unique_idx',
  ).on(t.providerRef),
]);


/**
 * The exact disclaimer text a person agreed to, hashed and versioned. This
 * record is the entire defense if a contribution is disputed a year later.
 */
export const consentRecords = pgTable('consent_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  contributionId: uuid('contribution_id').references(() => contributions.id, { onDelete: 'cascade' }),
  supportType: supportType('support_type').notNull(),
  textVersion: text('text_version').notNull(),
  textHash: text('text_hash').notNull(),
  agreedAt: timestamp('agreed_at', { withTimezone: true }).defaultNow().notNull(),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  sponsorId: uuid('sponsor_id'),
  contributionId: uuid('contribution_id').references(() => contributions.id, { onDelete: 'set null' }),
  number: integer('number').notNull(),
  amountCents: integer('amount_cents').notNull(),
  status: invoiceStatus('status').default('draft').notNull(),
  pdfPath: text('pdf_path'),
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex('invoices_number_idx').on(t.number)]);

/** Provider event dedupe. Without this, a webhook retry double-counts money. */
export const webhookEvents = pgTable('webhook_events', {
  id: text('id').primaryKey(),
  provider: paymentProvider('provider').notNull(),
  type: text('type').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});

export const idempotencyKeys = pgTable('idempotency_keys', {
  key: text('key').primaryKey(),
  scope: text('scope').notNull(),
  result: jsonb('result').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
