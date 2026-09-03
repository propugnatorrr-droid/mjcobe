-- Adds the brand_submission_invites table (Batch D: secure brand submission
-- workflow). Hand-authored following the exact policy established by
-- 0013_brand_feed_posts.sql: every new migration in this initiative is
-- hand-written with IF NOT EXISTS guards rather than trusting
-- `drizzle-kit generate`, because meta/_journal.json is missing entries for
-- 0002/0003/0012 and generation against that stale baseline both mis-numbers
-- new migrations and tries to re-emit already-applied changes. See
-- docs/STANDALONE_COMMERCE_FEED_TICKETING_PROGRESS.md for the full account.

CREATE TABLE IF NOT EXISTS "brand_submission_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_by_admin_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"used_at" timestamp with time zone,
	"resulting_post_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brand_submission_invites_sponsor_id_sponsors_id_fk'
  ) THEN
    ALTER TABLE "brand_submission_invites"
      ADD CONSTRAINT "brand_submission_invites_sponsor_id_sponsors_id_fk"
      FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brand_submission_invites_created_by_admin_id_admin_users_id_fk'
  ) THEN
    ALTER TABLE "brand_submission_invites"
      ADD CONSTRAINT "brand_submission_invites_created_by_admin_id_admin_users_id_fk"
      FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admin_users"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brand_submission_invites_resulting_post_id_brand_feed_posts_id_fk'
  ) THEN
    ALTER TABLE "brand_submission_invites"
      ADD CONSTRAINT "brand_submission_invites_resulting_post_id_brand_feed_posts_id_fk"
      FOREIGN KEY ("resulting_post_id") REFERENCES "public"."brand_feed_posts"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "brand_submission_invites_token_hash_idx" ON "brand_submission_invites" USING btree ("token_hash");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "brand_submission_invites_sponsor_idx" ON "brand_submission_invites" USING btree ("sponsor_id");
