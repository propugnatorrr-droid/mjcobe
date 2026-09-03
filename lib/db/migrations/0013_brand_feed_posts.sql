-- Adds the brand_feed_posts table (moderated brand feed foundation).
--
-- Numbered 0013 rather than the 0002 drizzle-kit assigned: drizzle-kit's
-- own journal (meta/_journal.json) only knows about 0000/0001 — migrations
-- 0002_stripe_payment_reconciliation, 0003_notification_delivery, and
-- 0012_phase_7_integrity were applied out-of-band and were never
-- snapshotted, so `drizzle-kit generate` diffs against a stale baseline
-- and both mis-numbers new migrations and tries to re-emit already-applied
-- changes. See docs/STANDALONE_COMMERCE_FEED_TICKETING_PROGRESS.md's
-- "Migration-journal investigation" section for the full account. This
-- file was hand-extracted from that raw generated output to contain only
-- the genuinely new brand_feed_posts table — every unrelated statement
-- drizzle-kit tried to re-emit (columns/indexes already added by
-- 0002/0003/0012, plus two more previously-undocumented drift items —
-- analytics_events.event_key and a badge_grants unique index — that this
-- generate run surfaced) was deliberately dropped from this file rather
-- than bundled in under a misleading migration name. That drift is
-- unrelated to this initiative and is flagged separately in the progress
-- doc for the user's own follow-up.
--
-- Every statement below is IF NOT EXISTS-guarded, matching the defensive
-- style 0002/0003/0012 already established, so this migration is safe to
-- run regardless of what has or hasn't already been applied.

CREATE TABLE IF NOT EXISTS "brand_feed_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"post_type" text NOT NULL,
	"title" text,
	"body" text,
	"media_asset_id" uuid,
	"cta_label" text,
	"cta_url" text,
	"related_song_id" uuid,
	"related_campaign_id" uuid,
	"submission_source" text DEFAULT 'admin' NOT NULL,
	"moderation" "moderation_state" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"rights_attested" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_admin_id" uuid,
	"scheduled_for" timestamp with time zone,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"sort_priority" integer DEFAULT 0 NOT NULL,
	"original_submission" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brand_feed_posts_sponsor_id_sponsors_id_fk'
  ) THEN
    ALTER TABLE "brand_feed_posts"
      ADD CONSTRAINT "brand_feed_posts_sponsor_id_sponsors_id_fk"
      FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brand_feed_posts_media_asset_id_media_assets_id_fk'
  ) THEN
    ALTER TABLE "brand_feed_posts"
      ADD CONSTRAINT "brand_feed_posts_media_asset_id_media_assets_id_fk"
      FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id")
      ON DELETE no action ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brand_feed_posts_related_song_id_songs_id_fk'
  ) THEN
    ALTER TABLE "brand_feed_posts"
      ADD CONSTRAINT "brand_feed_posts_related_song_id_songs_id_fk"
      FOREIGN KEY ("related_song_id") REFERENCES "public"."songs"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brand_feed_posts_related_campaign_id_campaigns_id_fk'
  ) THEN
    ALTER TABLE "brand_feed_posts"
      ADD CONSTRAINT "brand_feed_posts_related_campaign_id_campaigns_id_fk"
      FOREIGN KEY ("related_campaign_id") REFERENCES "public"."campaigns"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brand_feed_posts_reviewed_by_admin_id_admin_users_id_fk'
  ) THEN
    ALTER TABLE "brand_feed_posts"
      ADD CONSTRAINT "brand_feed_posts_reviewed_by_admin_id_admin_users_id_fk"
      FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "public"."admin_users"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "brand_feed_posts_slug_idx" ON "brand_feed_posts" USING btree ("slug");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "brand_feed_posts_moderation_published_idx" ON "brand_feed_posts" USING btree ("moderation","published_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "brand_feed_posts_sponsor_idx" ON "brand_feed_posts" USING btree ("sponsor_id");
