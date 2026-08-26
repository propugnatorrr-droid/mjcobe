CREATE TYPE "public"."admin_role" AS ENUM('super_admin', 'content_admin', 'finance_admin', 'partnership_admin', 'moderator', 'analytics_viewer');--> statement-breakpoint
CREATE TYPE "public"."blocklist_kind" AS ENUM('domain', 'email', 'name', 'category', 'industry');--> statement-breakpoint
CREATE TYPE "public"."campaign_kind" AS ENUM('release', 'video', 'remix', 'tour', 'other');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'live', 'funded', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'paid', 'void');--> statement-breakpoint
CREATE TYPE "public"."journey_event_kind" AS ENUM('preview_uploaded', 'supporter_milestone', 'funding_milestone', 'new_top_sponsor', 'new_top_supporter', 'production_update', 'release', 'video_release', 'stream_milestone', 'view_milestone', 'campaign_opened', 'campaign_closed', 'manual');--> statement-breakpoint
CREATE TYPE "public"."leaderboard_scope" AS ENUM('fan', 'business');--> statement-breakpoint
CREATE TYPE "public"."ledger_kind" AS ENUM('contribution', 'refund', 'chargeback', 'fee', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('image', 'video', 'audio', 'logo');--> statement-breakpoint
CREATE TYPE "public"."milestone_kind" AS ENUM('supporters_100', 'raised_5k', 'raised_10k', 'funded_50', 'funded_100', 'new_top_sponsor', 'new_presenting_partner');--> statement-breakpoint
CREATE TYPE "public"."moderation_state" AS ENUM('pending', 'approved', 'flagged', 'hidden', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."offline_method" AS ENUM('cash', 'check', 'wire', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('mock', 'stripe', 'offline');--> statement-breakpoint
CREATE TYPE "public"."refund_reason" AS ENUM('unverified_sponsor', 'fraud_risk', 'brand_safety', 'duplicate_payment', 'customer_request', 'other');--> statement-breakpoint
CREATE TYPE "public"."social_format" AS ENUM('story', 'feed', 'landscape', 'square');--> statement-breakpoint
CREATE TYPE "public"."song_status" AS ENUM('draft', 'building', 'coming_soon', 'released', 'vault');--> statement-breakpoint
CREATE TYPE "public"."sponsor_bid_state" AS ENUM('pending', 'approved', 'declined', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."support_type" AS ENUM('fan', 'business');--> statement-breakpoint
CREATE TYPE "public"."transaction_state" AS ENUM('initiated', 'authorized', 'captured', 'settled', 'failed', 'canceled', 'refunded', 'partially_refunded', 'disputed', 'charged_back');--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"song_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"kind" "campaign_kind" DEFAULT 'release' NOT NULL,
	"name" text NOT NULL,
	"objective" text,
	"goal_cents" integer NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"accept_support" boolean DEFAULT true NOT NULL,
	"fan_support_enabled" boolean DEFAULT true NOT NULL,
	"business_sponsorship_enabled" boolean DEFAULT true NOT NULL,
	"min_bid_cents" integer,
	"min_increment_cents" integer,
	"sponsor_auto_approve" boolean DEFAULT false NOT NULL,
	"sponsor_approval_threshold_cents" integer,
	"allocation_note" text,
	"preview_secret" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gated_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"media_asset_id" uuid,
	"title" text NOT NULL,
	"min_tier_cents" integer DEFAULT 0 NOT NULL,
	"is_downloadable" boolean DEFAULT false NOT NULL,
	"watermark_per_user" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lookbook_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"concept" text NOT NULL,
	"model" text,
	"prompt" text,
	"seed" text,
	"reference_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_reference_only" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "media_kind" NOT NULL,
	"role" text NOT NULL,
	"path" text NOT NULL,
	"derivatives" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"width" integer,
	"height" integer,
	"duration_ms" integer,
	"bytes" integer,
	"placeholder" text,
	"dominant_color" text,
	"alt_copy_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"status" "song_status" DEFAULT 'draft' NOT NULL,
	"cover_asset_id" uuid,
	"audio_asset_id" uuid,
	"preview_start_ms" integer DEFAULT 0 NOT NULL,
	"preview_end_ms" integer DEFAULT 30000 NOT NULL,
	"allow_full_playback" boolean DEFAULT false NOT NULL,
	"description" text,
	"lyrics" text,
	"release_date" date,
	"spotify_url" text,
	"apple_music_url" text,
	"youtube_url" text,
	"music_video_url" text,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsor_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"name" text NOT NULL,
	"price_cents" integer NOT NULL,
	"deliverables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"includes_branded_visual" boolean DEFAULT false NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"name" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"description" text,
	"benefits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"badge_key" text,
	"quantity_limit" integer,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_access_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supporter_id" uuid,
	"gated_asset_id" uuid NOT NULL,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_hash" text
);
--> statement-breakpoint
CREATE TABLE "badge_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"badge_id" uuid NOT NULL,
	"supporter_id" uuid NOT NULL,
	"campaign_id" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"is_automatic" boolean DEFAULT true NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entitlement_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supporter_id" uuid NOT NULL,
	"gated_asset_id" uuid NOT NULL,
	"source" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notification_prefs" (
	"supporter_id" uuid PRIMARY KEY NOT NULL,
	"competitive_alerts" boolean DEFAULT true NOT NULL,
	"milestone_alerts" boolean DEFAULT true NOT NULL,
	"quiet_hours_start" integer DEFAULT 22 NOT NULL,
	"quiet_hours_end" integer DEFAULT 9 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supporter_id" uuid,
	"sponsor_id" uuid,
	"kind" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rank_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"scope" "leaderboard_scope" NOT NULL,
	"supporter_id" uuid,
	"sponsor_id" uuid,
	"rank" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supporter_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"contribution_id" uuid,
	"series_key" text NOT NULL,
	"number" integer NOT NULL,
	"is_reserved" boolean DEFAULT false NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supporters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email_hash" text NOT NULL,
	"email" text,
	"display_name" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"instagram" text,
	"tiktok" text,
	"website" text,
	"links_public" boolean DEFAULT false NOT NULL,
	"city" text,
	"country" text,
	"moderation" "moderation_state" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"username" text,
	"email_verified_at" timestamp with time zone,
	"supporter_since" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contribution_id" uuid,
	"support_type" "support_type" NOT NULL,
	"text_version" text NOT NULL,
	"text_hash" text NOT NULL,
	"agreed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_hash" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"song_id" uuid NOT NULL,
	"supporter_id" uuid,
	"sponsor_id" uuid,
	"support_type" "support_type" NOT NULL,
	"tier_id" uuid,
	"amount_cents" integer NOT NULL,
	"display_name_snapshot" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"leaderboard_visible" boolean DEFAULT true NOT NULL,
	"hide_amount" boolean DEFAULT false NOT NULL,
	"moderation" "moderation_state" DEFAULT 'pending' NOT NULL,
	"referral_link_id" uuid,
	"is_test" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"state" text NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsor_id" uuid,
	"contribution_id" uuid,
	"number" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"pdf_path" text,
	"issued_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"contribution_id" uuid NOT NULL,
	"transaction_id" uuid,
	"supporter_id" uuid,
	"sponsor_id" uuid,
	"kind" "ledger_kind" NOT NULL,
	"amount_cents" integer NOT NULL,
	"note" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"reason" "refund_reason" NOT NULL,
	"note" text,
	"admin_user_id" uuid,
	"provider_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contribution_id" uuid NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_ref" text,
	"state" "transaction_state" DEFAULT 'initiated' NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"offline_method" "offline_method",
	"failure_code" text,
	"is_test" boolean DEFAULT false NOT NULL,
	"authorized_at" timestamp with time zone,
	"captured_at" timestamp with time zone,
	"settled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"campaign_id" uuid,
	"pdf_path" text,
	"signed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exclusivity_locks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "impressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"campaign_id" uuid,
	"session_id" text NOT NULL,
	"surface" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsor_bids" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"contribution_id" uuid,
	"amount_cents" integer NOT NULL,
	"state" "sponsor_bid_state" DEFAULT 'pending' NOT NULL,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sponsor_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"is_prohibited" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"business_name" text NOT NULL,
	"rep_name" text,
	"email" text,
	"phone" text,
	"website" text,
	"instagram" text,
	"shop_url" text,
	"logo_asset_id" uuid,
	"category_id" uuid,
	"industry" text,
	"description" text,
	"message" text,
	"moderation" "moderation_state" DEFAULT 'pending' NOT NULL,
	"approved_at" timestamp with time zone,
	"supported_since" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"kind" "milestone_kind" NOT NULL,
	"reached_at" timestamp with time zone,
	"graphic_asset_id" uuid,
	"is_published" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"song_id" uuid,
	"campaign_id" uuid,
	"kind" "journey_event_kind" NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"media_asset_id" uuid,
	"occurred_at" timestamp with time zone NOT NULL,
	"is_auto" boolean DEFAULT true NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"target_path" text NOT NULL,
	"contribution_id" uuid,
	"clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"contribution_id" uuid,
	"sponsor_id" uuid,
	"format" "social_format" NOT NULL,
	"path" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "song_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"song_id" uuid NOT NULL,
	"campaign_id" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"min_tier_cents" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"is_visible" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" "admin_role" DEFAULT 'super_admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"song_id" uuid,
	"campaign_id" uuid,
	"session_id" text NOT NULL,
	"path" text,
	"referrer" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"before" jsonb,
	"after" jsonb,
	"reason" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "blocklist_kind" NOT NULL,
	"value" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"key" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"state" "moderation_state" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "referral_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"campaign_id" uuid,
	"sponsor_id" uuid,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referral_link_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_admin_id" uuid
);
--> statement-breakpoint
CREATE TABLE "site_copy" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_admin_id" uuid
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gated_assets" ADD CONSTRAINT "gated_assets_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gated_assets" ADD CONSTRAINT "gated_assets_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lookbook_assets" ADD CONSTRAINT "lookbook_assets_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_cover_asset_id_media_assets_id_fk" FOREIGN KEY ("cover_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_audio_asset_id_media_assets_id_fk" FOREIGN KEY ("audio_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor_packages" ADD CONSTRAINT "sponsor_packages_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tiers" ADD CONSTRAINT "support_tiers_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_access_log" ADD CONSTRAINT "asset_access_log_supporter_id_supporters_id_fk" FOREIGN KEY ("supporter_id") REFERENCES "public"."supporters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_access_log" ADD CONSTRAINT "asset_access_log_gated_asset_id_gated_assets_id_fk" FOREIGN KEY ("gated_asset_id") REFERENCES "public"."gated_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_grants" ADD CONSTRAINT "badge_grants_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_grants" ADD CONSTRAINT "badge_grants_supporter_id_supporters_id_fk" FOREIGN KEY ("supporter_id") REFERENCES "public"."supporters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_grants" ADD CONSTRAINT "badge_grants_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlement_grants" ADD CONSTRAINT "entitlement_grants_supporter_id_supporters_id_fk" FOREIGN KEY ("supporter_id") REFERENCES "public"."supporters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlement_grants" ADD CONSTRAINT "entitlement_grants_gated_asset_id_gated_assets_id_fk" FOREIGN KEY ("gated_asset_id") REFERENCES "public"."gated_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_supporter_id_supporters_id_fk" FOREIGN KEY ("supporter_id") REFERENCES "public"."supporters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_supporter_id_supporters_id_fk" FOREIGN KEY ("supporter_id") REFERENCES "public"."supporters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_snapshots" ADD CONSTRAINT "rank_snapshots_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_snapshots" ADD CONSTRAINT "rank_snapshots_supporter_id_supporters_id_fk" FOREIGN KEY ("supporter_id") REFERENCES "public"."supporters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supporter_numbers" ADD CONSTRAINT "supporter_numbers_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supporters" ADD CONSTRAINT "supporters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_contribution_id_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."contributions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_supporter_id_supporters_id_fk" FOREIGN KEY ("supporter_id") REFERENCES "public"."supporters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_tier_id_support_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."support_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contribution_id_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."contributions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_contribution_id_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."contributions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_supporter_id_supporters_id_fk" FOREIGN KEY ("supporter_id") REFERENCES "public"."supporters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_contribution_id_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."contributions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exclusivity_locks" ADD CONSTRAINT "exclusivity_locks_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exclusivity_locks" ADD CONSTRAINT "exclusivity_locks_category_id_sponsor_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."sponsor_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exclusivity_locks" ADD CONSTRAINT "exclusivity_locks_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impressions" ADD CONSTRAINT "impressions_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impressions" ADD CONSTRAINT "impressions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor_bids" ADD CONSTRAINT "sponsor_bids_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor_bids" ADD CONSTRAINT "sponsor_bids_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_logo_asset_id_media_assets_id_fk" FOREIGN KEY ("logo_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_category_id_sponsor_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."sponsor_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_milestones" ADD CONSTRAINT "campaign_milestones_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_milestones" ADD CONSTRAINT "campaign_milestones_graphic_asset_id_media_assets_id_fk" FOREIGN KEY ("graphic_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_events" ADD CONSTRAINT "journey_events_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_events" ADD CONSTRAINT "journey_events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_events" ADD CONSTRAINT "journey_events_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_assets" ADD CONSTRAINT "social_assets_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_updates" ADD CONSTRAINT "song_updates_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_updates" ADD CONSTRAINT "song_updates_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_visits" ADD CONSTRAINT "referral_visits_referral_link_id_referral_links_id_fk" FOREIGN KEY ("referral_link_id") REFERENCES "public"."referral_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "campaigns_slug_idx" ON "campaigns" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "campaigns_song_idx" ON "campaigns" USING btree ("song_id");--> statement-breakpoint
CREATE UNIQUE INDEX "songs_slug_idx" ON "songs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "support_tiers_campaign_idx" ON "support_tiers" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "badge_grants_supporter_idx" ON "badge_grants" USING btree ("supporter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "badges_key_idx" ON "badges" USING btree ("key");--> statement-breakpoint
CREATE INDEX "entitlement_grants_supporter_idx" ON "entitlement_grants" USING btree ("supporter_id");--> statement-breakpoint
CREATE INDEX "rank_snapshots_campaign_idx" ON "rank_snapshots" USING btree ("campaign_id","scope","captured_at");--> statement-breakpoint
CREATE UNIQUE INDEX "supporter_numbers_unique_idx" ON "supporter_numbers" USING btree ("campaign_id","series_key","number");--> statement-breakpoint
CREATE INDEX "supporters_email_hash_idx" ON "supporters" USING btree ("email_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "contributions_campaign_idx" ON "contributions" USING btree ("campaign_id","support_type");--> statement-breakpoint
CREATE INDEX "contributions_supporter_idx" ON "contributions" USING btree ("supporter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_number_idx" ON "invoices" USING btree ("number");--> statement-breakpoint
CREATE INDEX "ledger_campaign_idx" ON "ledger_entries" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "ledger_supporter_idx" ON "ledger_entries" USING btree ("supporter_id");--> statement-breakpoint
CREATE INDEX "transactions_state_idx" ON "transactions" USING btree ("state");--> statement-breakpoint
CREATE INDEX "impressions_sponsor_idx" ON "impressions" USING btree ("sponsor_id","occurred_at");--> statement-breakpoint
CREATE INDEX "sponsor_bids_campaign_idx" ON "sponsor_bids" USING btree ("campaign_id","state");--> statement-breakpoint
CREATE UNIQUE INDEX "sponsor_categories_slug_idx" ON "sponsor_categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "sponsors_slug_idx" ON "sponsors" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_milestones_unique_idx" ON "campaign_milestones" USING btree ("campaign_id","kind");--> statement-breakpoint
CREATE INDEX "journey_events_occurred_idx" ON "journey_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "share_links_code_idx" ON "share_links" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_idx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "analytics_events_kind_idx" ON "analytics_events" USING btree ("kind","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blocklist_unique_idx" ON "blocklist" USING btree ("kind","value");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_links_code_idx" ON "referral_links" USING btree ("code");