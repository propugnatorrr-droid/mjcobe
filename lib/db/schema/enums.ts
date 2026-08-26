import { pgEnum } from 'drizzle-orm/pg-core';

export const songStatus = pgEnum('song_status', [
  'draft', 'building', 'coming_soon', 'released', 'vault',
]);

export const campaignKind = pgEnum('campaign_kind', [
  'release', 'video', 'remix', 'tour', 'other',
]);

export const campaignStatus = pgEnum('campaign_status', [
  'draft', 'live', 'funded', 'closed', 'archived',
]);

export const supportType = pgEnum('support_type', ['fan', 'business']);

/**
 * The full lifecycle. Only `settled` may contribute to any public number —
 * enforced in the ranking engine, not here.
 */
export const transactionState = pgEnum('transaction_state', [
  'initiated', 'authorized', 'captured', 'settled',
  'failed', 'canceled', 'refunded', 'partially_refunded',
  'disputed', 'charged_back',
]);

export const paymentProvider = pgEnum('payment_provider', ['mock', 'stripe', 'offline']);

export const offlineMethod = pgEnum('offline_method', ['cash', 'check', 'wire', 'other']);

/** Signed append-only movements. Sum of these IS the balance. */
export const ledgerKind = pgEnum('ledger_kind', [
  'contribution', 'refund', 'chargeback', 'fee', 'adjustment',
]);

export const refundReason = pgEnum('refund_reason', [
  'unverified_sponsor', 'fraud_risk', 'brand_safety',
  'duplicate_payment', 'customer_request', 'other',
]);

export const moderationState = pgEnum('moderation_state', [
  'pending', 'approved', 'flagged', 'hidden', 'blocked',
]);

export const sponsorBidState = pgEnum('sponsor_bid_state', [
  'pending', 'approved', 'declined', 'withdrawn',
]);

export const leaderboardScope = pgEnum('leaderboard_scope', ['fan', 'business']);

export const journeyEventKind = pgEnum('journey_event_kind', [
  'preview_uploaded', 'supporter_milestone', 'funding_milestone',
  'new_top_sponsor', 'new_top_supporter', 'production_update',
  'release', 'video_release', 'stream_milestone', 'view_milestone',
  'campaign_opened', 'campaign_closed', 'manual',
]);

export const milestoneKind = pgEnum('milestone_kind', [
  'supporters_100', 'raised_5k', 'raised_10k',
  'funded_50', 'funded_100', 'new_top_sponsor', 'new_presenting_partner',
]);

export const mediaKind = pgEnum('media_kind', ['image', 'video', 'audio', 'logo']);

export const socialFormat = pgEnum('social_format', ['story', 'feed', 'landscape', 'square']);

export const adminRole = pgEnum('admin_role', [
  'super_admin', 'content_admin', 'finance_admin',
  'partnership_admin', 'moderator', 'analytics_viewer',
]);

export const blocklistKind = pgEnum('blocklist_kind', [
  'domain', 'email', 'name', 'category', 'industry',
]);

export const invoiceStatus = pgEnum('invoice_status', ['draft', 'issued', 'paid', 'void']);
