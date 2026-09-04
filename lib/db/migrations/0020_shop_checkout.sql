-- Adds fulfillments (Batch J: shop checkout, orders, fulfillment).
-- Hand-authored, IF NOT EXISTS-guarded, same policy as 0013-0019.
-- Nothing else new schema-wise this batch — checkout reuses Batch G's
-- commerce_orders/commerce_order_items/commerce_payments/
-- inventory_reservations verbatim, and stock commitment reuses Batch I's
-- product_variants/inventory_movements verbatim.

CREATE TABLE IF NOT EXISTS "fulfillments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" text DEFAULT 'unfulfilled' NOT NULL,
	"carrier" text,
	"tracking_number" text,
	"shipped_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "fulfillments_order_idx" ON "fulfillments" USING btree ("order_id");
