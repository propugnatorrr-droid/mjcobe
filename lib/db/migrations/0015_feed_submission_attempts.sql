-- Adds the feed_submission_attempts table (Batch D: rate limiting for the
-- public brand-submission route). Hand-authored, same policy as
-- 0013/0014 — see those files' header comments for why.

CREATE TABLE IF NOT EXISTS "feed_submission_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invite_id" uuid,
	"ip_hash" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feed_submission_attempts_invite_id_brand_submission_invites_id_fk'
  ) THEN
    ALTER TABLE "feed_submission_attempts"
      ADD CONSTRAINT "feed_submission_attempts_invite_id_brand_submission_invites_id_fk"
      FOREIGN KEY ("invite_id") REFERENCES "public"."brand_submission_invites"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "feed_submission_attempts_invite_idx" ON "feed_submission_attempts" USING btree ("invite_id","occurred_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "feed_submission_attempts_ip_idx" ON "feed_submission_attempts" USING btree ("ip_hash","occurred_at");
