import 'server-only';
import { cache } from 'react';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';

export type PublicVariant = {
  id: string;
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  inStock: boolean;
};

export type PublicProductMedia = { path: string; placeholder: string | null };

export type PublicProduct = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  featured: boolean;
  media: PublicProductMedia[];
  variants: PublicVariant[];
};

function publiclyVisibleWhere() {
  return eq(s.products.status, 'active');
}

async function attachMediaAndVariants<T extends { id: string }>(products: T[]): Promise<(T & { media: PublicProductMedia[]; variants: PublicVariant[] })[]> {
  if (products.length === 0) return [];
  const productIds = products.map((p) => p.id);

  const [mediaRows, variantRows] = await Promise.all([
    db
      .select({
        productId: s.productMedia.productId,
        path: s.mediaAssets.path,
        placeholder: s.mediaAssets.placeholder,
        sortIndex: s.productMedia.sortIndex,
      })
      .from(s.productMedia)
      .innerJoin(s.mediaAssets, eq(s.mediaAssets.id, s.productMedia.mediaAssetId))
      .where(inArray(s.productMedia.productId, productIds))
      .orderBy(asc(s.productMedia.sortIndex)),
    db
      .select()
      .from(s.productVariants)
      .where(and(inArray(s.productVariants.productId, productIds), eq(s.productVariants.isActive, true)))
      .orderBy(asc(s.productVariants.sortIndex), asc(s.productVariants.priceCents)),
  ]);

  const mediaByProduct = new Map<string, PublicProductMedia[]>();
  for (const row of mediaRows) {
    const list = mediaByProduct.get(row.productId) ?? [];
    list.push({ path: row.path, placeholder: row.placeholder });
    mediaByProduct.set(row.productId, list);
  }

  const variantsByProduct = new Map<string, PublicVariant[]>();
  for (const row of variantRows) {
    const list = variantsByProduct.get(row.productId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      priceCents: row.priceCents,
      compareAtCents: row.compareAtCents,
      inStock: !row.inventoryTracked || row.stockOnHand > 0,
    });
    variantsByProduct.set(row.productId, list);
  }

  return products.map((product) => ({
    ...product,
    media: mediaByProduct.get(product.id) ?? [],
    variants: variantsByProduct.get(product.id) ?? [],
  }));
}

export const listPublicProducts = cache(async (): Promise<PublicProduct[]> => {
  const rows = await db
    .select({
      id: s.products.id,
      slug: s.products.slug,
      title: s.products.title,
      description: s.products.description,
      featured: s.products.featured,
    })
    .from(s.products)
    .where(publiclyVisibleWhere())
    .orderBy(desc(s.products.featured), asc(s.products.sortIndex), desc(s.products.createdAt));

  return attachMediaAndVariants(rows);
});

export const getPublicProduct = cache(async (slug: string): Promise<PublicProduct | null> => {
  const [row] = await db
    .select({
      id: s.products.id,
      slug: s.products.slug,
      title: s.products.title,
      description: s.products.description,
      featured: s.products.featured,
    })
    .from(s.products)
    .where(and(eq(s.products.slug, slug), publiclyVisibleWhere()))
    .limit(1);

  if (!row) return null;
  const [withDetails] = await attachMediaAndVariants([row]);
  return withDetails;
});

export type PurchasableVariant = {
  variantId: string;
  variantName: string;
  priceCents: number;
  isActive: boolean;
  productId: string;
  productTitle: string;
  productSlug: string;
  productStatus: string;
  shippingRequired: boolean;
};

/**
 * The single server-authoritative read for "can this variant currently be
 * bought, and what does it actually cost" — used by BOTH the checkout
 * page (to display cart contents) and the checkout action (to validate
 * them), so the two can never drift apart. A stale/tampered cart cookie
 * is never trusted for price or availability, matching
 * loadPayableCampaign()'s discipline elsewhere in this codebase.
 */
export async function getVariantForCheckout(variantId: string): Promise<PurchasableVariant | null> {
  const [row] = await db
    .select({
      variantId: s.productVariants.id,
      variantName: s.productVariants.name,
      priceCents: s.productVariants.priceCents,
      isActive: s.productVariants.isActive,
      productId: s.products.id,
      productTitle: s.products.title,
      productSlug: s.products.slug,
      productStatus: s.products.status,
      shippingRequired: s.products.shippingRequired,
    })
    .from(s.productVariants)
    .innerJoin(s.products, eq(s.products.id, s.productVariants.productId))
    .where(eq(s.productVariants.id, variantId))
    .limit(1);

  if (!row || !row.isActive || row.productStatus !== 'active') return null;
  return row;
}

// --------------------------------------------------------------- admin ----

export type AdminProduct = typeof s.products.$inferSelect;
export type AdminVariant = typeof s.productVariants.$inferSelect;
export type AdminProductMediaRow = { id: string; mediaAssetId: string; path: string; sortIndex: number };

export async function listAdminProducts(): Promise<AdminProduct[]> {
  return db.select().from(s.products).orderBy(desc(s.products.createdAt));
}

export async function getAdminProduct(id: string): Promise<{
  product: AdminProduct;
  variants: AdminVariant[];
  media: AdminProductMediaRow[];
} | null> {
  const [product] = await db.select().from(s.products).where(eq(s.products.id, id)).limit(1);
  if (!product) return null;

  const [variants, mediaRows] = await Promise.all([
    db.select().from(s.productVariants).where(eq(s.productVariants.productId, id)).orderBy(asc(s.productVariants.sortIndex)),
    db
      .select({ id: s.productMedia.id, mediaAssetId: s.productMedia.mediaAssetId, path: s.mediaAssets.path, sortIndex: s.productMedia.sortIndex })
      .from(s.productMedia)
      .innerJoin(s.mediaAssets, eq(s.mediaAssets.id, s.productMedia.mediaAssetId))
      .where(eq(s.productMedia.productId, id))
      .orderBy(asc(s.productMedia.sortIndex)),
  ]);

  return { product, variants, media: mediaRows };
}
