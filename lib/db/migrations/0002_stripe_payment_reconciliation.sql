ALTER TABLE "refunds"
  ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'succeeded' NOT NULL;
--> statement-breakpoint

ALTER TABLE "refunds"
  ADD COLUMN IF NOT EXISTS "failure_reason" text;
--> statement-breakpoint

ALTER TABLE "refunds"
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "refunds_provider_ref_unique_idx"
  ON "refunds" ("provider_ref")
  WHERE "provider_ref" IS NOT NULL;
--> statement-breakpoint

ALTER TABLE "ledger_entries"
  ADD COLUMN IF NOT EXISTS "refund_id" uuid;
--> statement-breakpoint

ALTER TABLE "ledger_entries"
  ADD COLUMN IF NOT EXISTS "external_ref" text;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ledger_entries_refund_id_refunds_id_fk'
  ) THEN
    ALTER TABLE "ledger_entries"
      ADD CONSTRAINT "ledger_entries_refund_id_refunds_id_fk"
      FOREIGN KEY ("refund_id")
      REFERENCES "refunds"("id")
      ON DELETE SET NULL;
  END IF;
END

$$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "ledger_refund_idx"
  ON "ledger_entries" ("refund_id");
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "ledger_external_ref_unique_idx"
  ON "ledger_entries" ("external_ref")
  WHERE "external_ref" IS NOT NULL;
--> statement-breakpoint

ALTER TABLE "disputes"
  ADD COLUMN IF NOT EXISTS "provider_ref" text;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "disputes_provider_ref_unique_idx"
  ON "disputes" ("provider_ref")
  WHERE "provider_ref" IS NOT NULL;
