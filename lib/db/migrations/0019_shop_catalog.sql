-- Adds the shop catalog schema (Batch I): products, product_media,
-- product_variants, inventory_movements. Hand-authored, IF NOT EXISTS-
-- guarded, same policy as 0013-0018. No checkout yet — commerce_orders
-- isn't referenced from here (Batch J adds that wiring).

CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"product_type" text DEFAULT 'merch' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"sale_start_at" timestamp with time zone,
	"sale_end_at" timestamp with time zone,
	"shipping_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_idx" ON "products" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_status_idx" ON "products" USING btree ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "product_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_media_product_id_products_id_fk'
  ) THEN
    ALTER TABLE "product_media"
      ADD CONSTRAINT "product_media_product_id_products_id_fk"
      FOREIGN KEY ("product_id") REFERENCES "public"."products"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_media_media_asset_id_media_assets_id_fk'
  ) THEN
    ALTER TABLE "product_media"
      ADD CONSTRAINT "product_media_media_asset_id_media_assets_id_fk"
      FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id")
      ON DELETE no action ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "product_media_product_idx" ON "product_media" USING btree ("product_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"price_cents" integer NOT NULL,
	"compare_at_cents" integer,
	"stock_on_hand" integer DEFAULT 0 NOT NULL,
	"inventory_tracked" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_product_id_products_id_fk'
  ) THEN
    ALTER TABLE "product_variants"
      ADD CONSTRAINT "product_variants_product_id_products_id_fk"
      FOREIGN KEY ("product_id") REFERENCES "public"."products"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_sku_idx" ON "product_variants" USING btree ("sku");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variants_product_idx" ON "product_variants" USING btree ("product_id");
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_stock_nonnegative'
  ) THEN
    ALTER TABLE "product_variants"
      ADD CONSTRAINT "product_variants_stock_nonnegative" CHECK ("stock_on_hand" >= 0);
  END IF;
END
$$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"order_item_id" uuid,
	"admin_user_id" uuid,
	"note" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_variant_id_product_variants_id_fk'
  ) THEN
    ALTER TABLE "inventory_movements"
      ADD CONSTRAINT "inventory_movements_variant_id_product_variants_id_fk"
      FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_movements_admin_user_id_admin_users_id_fk'
  ) THEN
    ALTER TABLE "inventory_movements"
      ADD CONSTRAINT "inventory_movements_admin_user_id_admin_users_id_fk"
      FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END
$$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "inventory_movements_variant_idx" ON "inventory_movements" USING btree ("variant_id");
