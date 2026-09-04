-- Adds tickets and ticket_check_ins (Batch H: ticket issuance and
-- check-in). Hand-authored, IF NOT EXISTS-guarded, same policy as
-- 0013-0017 — see those files' header comments.
--
-- Note on the credential scheme: per the plan's approval, ticket
-- credentials are HMAC-signed deterministic values derived from
-- (id, credential_version) — see lib/tickets/credentials.ts. There is no
-- token_hash column; nothing resembling a stored credential exists here.

CREATE TABLE IF NOT EXISTS "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"ticket_type_id" uuid NOT NULL,
	"credential_version" integer DEFAULT 0 NOT NULL,
	"display_code" text NOT NULL,
	"attendee_label" text,
	"status" text DEFAULT 'valid' NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checked_in_at" timestamp with time zone,
	"checked_in_by_admin_id" uuid,
	"voided_at" timestamp with time zone,
	"void_reason" text
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_order_item_id_commerce_order_items_id_fk'
  ) THEN
    ALTER TABLE "tickets"
      ADD CONSTRAINT "tickets_order_item_id_commerce_order_items_id_fk"
      FOREIGN KEY ("order_item_id") REFERENCES "public"."commerce_order_items"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_event_id_live_events_id_fk'
  ) THEN
    ALTER TABLE "tickets"
      ADD CONSTRAINT "tickets_event_id_live_events_id_fk"
      FOREIGN KEY ("event_id") REFERENCES "public"."live_events"("id")
      ON DELETE no action ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_ticket_type_id_ticket_types_id_fk'
  ) THEN
    ALTER TABLE "tickets"
      ADD CONSTRAINT "tickets_ticket_type_id_ticket_types_id_fk"
      FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id")
      ON DELETE no action ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_checked_in_by_admin_id_admin_users_id_fk'
  ) THEN
    ALTER TABLE "tickets"
      ADD CONSTRAINT "tickets_checked_in_by_admin_id_admin_users_id_fk"
      FOREIGN KEY ("checked_in_by_admin_id") REFERENCES "public"."admin_users"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "tickets_display_code_idx" ON "tickets" USING btree ("display_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_event_status_idx" ON "tickets" USING btree ("event_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_order_item_idx" ON "tickets" USING btree ("order_item_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "ticket_check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"action" text NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"reason" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ticket_check_ins_ticket_id_tickets_id_fk'
  ) THEN
    ALTER TABLE "ticket_check_ins"
      ADD CONSTRAINT "ticket_check_ins_ticket_id_tickets_id_fk"
      FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ticket_check_ins_admin_user_id_admin_users_id_fk'
  ) THEN
    ALTER TABLE "ticket_check_ins"
      ADD CONSTRAINT "ticket_check_ins_admin_user_id_admin_users_id_fk"
      FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id")
      ON DELETE no action ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "ticket_check_ins_ticket_idx" ON "ticket_check_ins" USING btree ("ticket_id");
