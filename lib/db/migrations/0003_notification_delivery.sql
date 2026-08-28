ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "dedupe_key" text;
--> statement-breakpoint

UPDATE "notifications"
SET "dedupe_key" = 'legacy:' || "id"::text
WHERE "dedupe_key" IS NULL;
--> statement-breakpoint

ALTER TABLE "notifications"
  ALTER COLUMN "dedupe_key" SET NOT NULL;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "notifications_dedupe_key_unique_idx"
  ON "notifications" ("dedupe_key");
--> statement-breakpoint

ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "recipient_email" text;
--> statement-breakpoint

ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "delivery_status" text DEFAULT 'pending' NOT NULL;
--> statement-breakpoint

UPDATE "notifications"
SET "delivery_status" =
  CASE
    WHEN "sent_at" IS NOT NULL THEN 'sent'
    ELSE 'pending'
  END;
--> statement-breakpoint

ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "attempt_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint

ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "provider_message_id" text;
--> statement-breakpoint

ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "last_error" text;
--> statement-breakpoint

ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "scheduled_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint

ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "notifications_delivery_queue_idx"
  ON "notifications" ("delivery_status", "scheduled_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "notifications_supporter_idx"
  ON "notifications" ("supporter_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "notifications_sponsor_idx"
  ON "notifications" ("sponsor_id");
