-- Adds the shared commerce schema (Batch G): commerce_orders,
-- commerce_order_items, commerce_payments, commerce_refunds,
-- order_addresses, inventory_reservations. Hand-authored, IF NOT EXISTS-
-- guarded, same policy as 0013-0016 — see those files' header comments.
-- Nothing in this migration touches contributions/transactions/refunds/
-- ledger_entries; this is a fully separate, additive schema.

CREATE TABLE IF NOT EXISTS "commerce_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_type" text NOT NULL,
	"order_number" text NOT NULL,
	"secure_token" text NOT NULL,
	"buyer_email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"shipping_cents" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "commerce_orders_order_number_idx" ON "commerce_orders" USING btree ("order_number");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "commerce_orders_secure_token_idx" ON "commerce_orders" USING btree ("secure_token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commerce_orders_status_idx" ON "commerce_orders" USING btree ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commerce_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"item_type" text NOT NULL,
	"reference_id" uuid NOT NULL,
	"title_snapshot" text NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"quantity" integer NOT NULL,
	"line_total_cents" integer NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'commerce_order_items_order_id_commerce_orders_id_fk'
  ) THEN
    ALTER TABLE "commerce_order_items"
      ADD CONSTRAINT "commerce_order_items_order_id_commerce_orders_id_fk"
      FOREIGN KEY ("order_id") REFERENCES "public"."commerce_orders"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "commerce_order_items_order_idx" ON "commerce_order_items" USING btree ("order_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commerce_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_ref" text,
	"state" text DEFAULT 'initiated' NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settled_at" timestamp with time zone
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'commerce_payments_order_id_commerce_orders_id_fk'
  ) THEN
    ALTER TABLE "commerce_payments"
      ADD CONSTRAINT "commerce_payments_order_id_commerce_orders_id_fk"
      FOREIGN KEY ("order_id") REFERENCES "public"."commerce_orders"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "commerce_payments_provider_ref_idx" ON "commerce_payments" USING btree ("provider_ref");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commerce_payments_order_idx" ON "commerce_payments" USING btree ("order_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "commerce_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'creating' NOT NULL,
	"provider_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'commerce_refunds_payment_id_commerce_payments_id_fk'
  ) THEN
    ALTER TABLE "commerce_refunds"
      ADD CONSTRAINT "commerce_refunds_payment_id_commerce_payments_id_fk"
      FOREIGN KEY ("payment_id") REFERENCES "public"."commerce_payments"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "commerce_refunds_provider_ref_idx" ON "commerce_refunds" USING btree ("provider_ref");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commerce_refunds_payment_idx" ON "commerce_refunds" USING btree ("payment_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "order_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"recipient_name" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"region" text,
	"postal_code" text NOT NULL,
	"country" text NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_addresses_order_id_commerce_orders_id_fk'
  ) THEN
    ALTER TABLE "order_addresses"
      ADD CONSTRAINT "order_addresses_order_id_commerce_orders_id_fk"
      FOREIGN KEY ("order_id") REFERENCES "public"."commerce_orders"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "order_addresses_order_idx" ON "order_addresses" USING btree ("order_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "inventory_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"order_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservations_order_id_commerce_orders_id_fk'
  ) THEN
    ALTER TABLE "inventory_reservations"
      ADD CONSTRAINT "inventory_reservations_order_id_commerce_orders_id_fk"
      FOREIGN KEY ("order_id") REFERENCES "public"."commerce_orders"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "inventory_reservations_resource_idx" ON "inventory_reservations" USING btree ("resource_type","resource_id","expires_at");
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'commerce_order_items_quantity_positive'
  ) THEN
    ALTER TABLE "commerce_order_items"
      ADD CONSTRAINT "commerce_order_items_quantity_positive" CHECK ("quantity" > 0);
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_reservations_quantity_positive'
  ) THEN
    ALTER TABLE "inventory_reservations"
      ADD CONSTRAINT "inventory_reservations_quantity_positive" CHECK ("quantity" > 0);
  END IF;
END
$$;
