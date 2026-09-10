-- Adds live_events and ticket_types (Batch F: events + journey integration).
-- Hand-authored, IF NOT EXISTS-guarded, same policy as 0013/0014/0015 — see
-- those files' header comments for why drizzle-kit generate isn't used
-- directly for this initiative's migrations.

CREATE TABLE IF NOT EXISTS "live_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"hero_asset_id" uuid,
	"venue_name" text NOT NULL,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"region" text,
	"postal_code" text,
	"country" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"timezone" text NOT NULL,
	"sales_start_at" timestamp with time zone,
	"sales_end_at" timestamp with time zone,
	"is_published" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"ticketing_enabled" boolean DEFAULT false NOT NULL,
	"capacity" integer,
	"cancellation_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- event_status enum, created before the column that uses it references it
-- as a real pg_enum type (matches how moderation_state etc. were created
-- for earlier tables in this initiative).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
    CREATE TYPE "event_status" AS ENUM ('scheduled', 'postponed', 'canceled', 'completed');
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_events' AND column_name = 'status' AND data_type = 'text'
  ) THEN
    -- The default must be dropped before the type change — Postgres can
    -- cast existing row values via USING, but it cannot automatically cast
    -- a text DEFAULT clause to the new enum type in the same statement.
    -- Confirmed live: without this, applying the migration fails with
    -- "default for column status cannot be cast automatically to type
    -- event_status" (error 42804).
    ALTER TABLE "live_events" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "live_events" ALTER COLUMN "status" TYPE "event_status" USING "status"::"event_status";
    ALTER TABLE "live_events" ALTER COLUMN "status" SET DEFAULT 'scheduled'::"event_status";
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'live_events_hero_asset_id_media_assets_id_fk'
  ) THEN
    ALTER TABLE "live_events"
      ADD CONSTRAINT "live_events_hero_asset_id_media_assets_id_fk"
      FOREIGN KEY ("hero_asset_id") REFERENCES "public"."media_assets"("id")
      ON DELETE no action ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'live_events_capacity_nonnegative'
  ) THEN
    ALTER TABLE "live_events"
      ADD CONSTRAINT "live_events_capacity_nonnegative" CHECK ("capacity" IS NULL OR "capacity" >= 0);
  END IF;
END
$$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "live_events_slug_idx" ON "live_events" USING btree ("slug");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "live_events_status_starts_idx" ON "live_events" USING btree ("status","starts_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "ticket_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_cents" integer NOT NULL,
	"capacity" integer NOT NULL,
	"per_order_limit" integer DEFAULT 8 NOT NULL,
	"sales_start_at" timestamp with time zone,
	"sales_end_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ticket_types_event_id_live_events_id_fk'
  ) THEN
    ALTER TABLE "ticket_types"
      ADD CONSTRAINT "ticket_types_event_id_live_events_id_fk"
      FOREIGN KEY ("event_id") REFERENCES "public"."live_events"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ticket_types_capacity_nonnegative'
  ) THEN
    ALTER TABLE "ticket_types"
      ADD CONSTRAINT "ticket_types_capacity_nonnegative" CHECK ("capacity" >= 0);
  END IF;
END
$$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "ticket_types_event_idx" ON "ticket_types" USING btree ("event_id");
--> statement-breakpoint

-- journey_events.live_event_id — nullable FK, same pattern as the existing
-- song_id/campaign_id columns on this table.
ALTER TABLE "journey_events" ADD COLUMN IF NOT EXISTS "live_event_id" uuid;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'journey_events_live_event_id_live_events_id_fk'
  ) THEN
    ALTER TABLE "journey_events"
      ADD CONSTRAINT "journey_events_live_event_id_live_events_id_fk"
      FOREIGN KEY ("live_event_id") REFERENCES "public"."live_events"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END
$$;
