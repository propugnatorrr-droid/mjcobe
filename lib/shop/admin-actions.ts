'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { requireAdminRole } from '@/lib/admin/guard';
import { recordAudit } from '@/lib/audit/log';
import { str, bool, slugify, parseAmountCents } from '@/lib/checkout/validate';
import { validateProductMedia, storeProductMedia } from '@/lib/shop/media';
import { inventoryAdjustmentDecision } from '@/lib/shop/inventory-decision';
import type { AdminState } from '@/lib/admin/actions';

/** Products are content_admin's domain per the launch role table
 * ("content_admin: products/event content/public feed content"). */
const PRODUCT_ROLES = ['content_admin'] as const;

function revalidateShopSurfaces(slug?: string) {
  revalidatePath('/admin/shop');
  revalidatePath('/shop');
  revalidatePath('/', 'layout');
  if (slug) revalidatePath(`/shop/${slug}`);
}

const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const;

function dateFrom(value: FormDataEntryValue | null): Date | null {
  const input = str(value, 40);
  if (!input) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

type ProductFields = {
  title: string;
  slug: string;
  description: string | null;
  status: (typeof PRODUCT_STATUSES)[number];
  featured: boolean;
  sortIndex: number;
  saleStartAt: Date | null;
  saleEndAt: Date | null;
  shippingRequired: boolean;
};

function readProductFields(formData: FormData, fallbackSlug?: string): ProductFields | { error: string } {
  const title = str(formData.get('title'), 200);
  if (!title) return { error: 'missing' };

  const status = str(formData.get('status'), 20) ?? 'draft';
  if (!PRODUCT_STATUSES.includes(status as (typeof PRODUCT_STATUSES)[number])) {
    return { error: 'invalid_status' };
  }

  const sortIndexRaw = str(formData.get('sortIndex'), 10);
  const sortIndex = sortIndexRaw ? Number(sortIndexRaw) : 0;

  return {
    title,
    slug: str(formData.get('slug'), 80) || slugify(title) || fallbackSlug || slugify(`product-${Date.now()}`),
    description: str(formData.get('description'), 4000),
    status: status as (typeof PRODUCT_STATUSES)[number],
    featured: bool(formData.get('featured')),
    sortIndex: Number.isInteger(sortIndex) ? sortIndex : 0,
    saleStartAt: dateFrom(formData.get('saleStartAt')),
    saleEndAt: dateFrom(formData.get('saleEndAt')),
    shippingRequired: bool(formData.get('shippingRequired')),
  };
}

export async function createProduct(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...PRODUCT_ROLES]);

  const fields = readProductFields(formData);
  if ('error' in fields) return fields;

  let slug = fields.slug;
  let attempt = 0;
  while (attempt < 20) {
    const [existing] = await db.select({ id: s.products.id }).from(s.products).where(eq(s.products.slug, slug)).limit(1);
    if (!existing) break;
    attempt += 1;
    slug = `${fields.slug}-${attempt + 1}`;
  }

  const [created] = await dbw
    .insert(s.products)
    .values({ ...fields, slug })
    .returning({ id: s.products.id });

  if (!created) return { error: 'failed' };

  await recordAudit({
    adminUserId: me.id,
    action: 'product.create',
    entity: 'product',
    entityId: created.id,
    after: { title: fields.title, slug, status: fields.status },
  });

  revalidateShopSurfaces(slug);

  return { ok: 'saved' };
}

export async function updateProduct(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...PRODUCT_ROLES]);

  const id = str(formData.get('id'), 100);
  if (!id) return { error: 'missing' };

  const [before] = await db.select().from(s.products).where(eq(s.products.id, id)).limit(1);
  if (!before) return { error: 'not_found' };

  const fields = readProductFields(formData, before.slug);
  if ('error' in fields) return fields;

  await dbw
    .update(s.products)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(s.products.id, id));

  await recordAudit({
    adminUserId: me.id,
    action: 'product.update',
    entity: 'product',
    entityId: id,
    before: { title: before.title, slug: before.slug, status: before.status },
    after: { title: fields.title, slug: fields.slug, status: fields.status },
  });

  revalidateShopSurfaces(before.slug);
  if (fields.slug !== before.slug) revalidateShopSurfaces(fields.slug);

  return { ok: 'saved' };
}

export async function uploadProductMedia(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...PRODUCT_ROLES]);

  const productId = str(formData.get('productId'), 100);
  if (!productId) return { error: 'missing' };

  const [product] = await db.select({ id: s.products.id, slug: s.products.slug }).from(s.products).where(eq(s.products.id, productId)).limit(1);
  if (!product) return { error: 'not_found' };

  const validation = await validateProductMedia(formData.get('media'));
  if (!validation.ok) return { error: `media_${validation.reason}` };
  if (!validation.file) return { error: 'missing' };

  const mediaAssetId = await storeProductMedia(validation.file, validation.detectedType!);

  const [existingCount] = await dbw
    .select({ total: sql<number>`count(*)` })
    .from(s.productMedia)
    .where(eq(s.productMedia.productId, productId));

  await dbw.insert(s.productMedia).values({ productId, mediaAssetId, sortIndex: Number(existingCount?.total ?? 0) });

  await recordAudit({
    adminUserId: me.id,
    action: 'product.add_media',
    entity: 'product',
    entityId: productId,
    after: { mediaAssetId },
  });

  revalidateShopSurfaces(product.slug);

  return { ok: 'saved' };
}

// ---------------------------------------------------------------- variants ----

function readVariantFields(formData: FormData): { name: string; sku: string; priceCents: number; compareAtCents: number | null } | { error: string } {
  const name = str(formData.get('name'), 100);
  const sku = str(formData.get('sku'), 60);
  const priceCents = parseAmountCents(formData.get('price'));
  if (!name || !sku || priceCents === null) return { error: 'missing' };

  const compareAtRaw = str(formData.get('compareAt'), 20);
  const compareAtCents = compareAtRaw ? parseAmountCents(formData.get('compareAt')) : null;

  return { name, sku, priceCents, compareAtCents };
}

export async function createVariant(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...PRODUCT_ROLES]);

  const productId = str(formData.get('productId'), 100);
  if (!productId) return { error: 'missing' };

  const fields = readVariantFields(formData);
  if ('error' in fields) return fields;

  const [product] = await db.select({ id: s.products.id, slug: s.products.slug }).from(s.products).where(eq(s.products.id, productId)).limit(1);
  if (!product) return { error: 'not_found' };

  const [existingSku] = await db.select({ id: s.productVariants.id }).from(s.productVariants).where(eq(s.productVariants.sku, fields.sku)).limit(1);
  if (existingSku) return { error: 'duplicate_sku' };

  const [created] = await dbw
    .insert(s.productVariants)
    .values({ ...fields, productId })
    .returning({ id: s.productVariants.id });

  if (!created) return { error: 'failed' };

  await recordAudit({
    adminUserId: me.id,
    action: 'product_variant.create',
    entity: 'product_variant',
    entityId: created.id,
    after: { productId, ...fields },
  });

  revalidateShopSurfaces(product.slug);

  return { ok: 'saved' };
}

export async function updateVariant(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...PRODUCT_ROLES]);

  const id = str(formData.get('id'), 100);
  if (!id) return { error: 'missing' };

  const [before] = await db.select().from(s.productVariants).where(eq(s.productVariants.id, id)).limit(1);
  if (!before) return { error: 'not_found' };

  const fields = readVariantFields(formData);
  if ('error' in fields) return fields;

  const isActive = bool(formData.get('isActive'));

  await dbw
    .update(s.productVariants)
    .set({ ...fields, isActive })
    .where(eq(s.productVariants.id, id));

  const [product] = await db.select({ slug: s.products.slug }).from(s.products).where(eq(s.products.id, before.productId)).limit(1);

  await recordAudit({
    adminUserId: me.id,
    action: 'product_variant.update',
    entity: 'product_variant',
    entityId: id,
    before: { name: before.name, priceCents: before.priceCents, isActive: before.isActive },
    after: { ...fields, isActive },
  });

  revalidateShopSurfaces(product?.slug);

  return { ok: 'saved' };
}

/**
 * Adjusts stock — writes an inventory_movements row and updates
 * product_variants.stockOnHand in the SAME transaction, per the plan's
 * approval correction: stockOnHand is the one authoritative quantity, and
 * every change to it happens alongside its own audit row, never as a bare
 * UPDATE on its own. A resulting negative stock is rejected outright
 * rather than silently clamped to zero, so an admin sees the mistake
 * instead of the system quietly hiding it.
 */
export async function adjustInventory(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...PRODUCT_ROLES]);

  const variantId = str(formData.get('variantId'), 100);
  const reason = str(formData.get('reason'), 30);
  const note = str(formData.get('note'), 500);
  if (!variantId || !reason) return { error: 'missing' };

  const deltaRaw = str(formData.get('delta'), 10);
  const delta = deltaRaw ? Number(deltaRaw) : NaN;

  const result = await dbw.transaction(async (tx) => {
    const [variant] = await tx.select().from(s.productVariants).where(eq(s.productVariants.id, variantId)).limit(1);
    if (!variant) return { error: 'not_found' as const };

    const decision = inventoryAdjustmentDecision({ currentStock: variant.stockOnHand, delta });
    if (!decision.ok) return { error: decision.reason };
    const { newStock } = decision;

    await tx.update(s.productVariants).set({ stockOnHand: newStock }).where(eq(s.productVariants.id, variantId));

    await tx.insert(s.inventoryMovements).values({
      variantId,
      delta,
      reason,
      note,
      adminUserId: me.id,
    });

    return { ok: true as const, productId: variant.productId };
  });

  if ('error' in result) return { error: result.error };

  const [product] = await db.select({ slug: s.products.slug }).from(s.products).where(eq(s.products.id, result.productId)).limit(1);

  await recordAudit({
    adminUserId: me.id,
    action: 'product_variant.adjust_inventory',
    entity: 'product_variant',
    entityId: variantId,
    reason: note,
    after: { delta, movementReason: reason },
  });

  revalidateShopSurfaces(product?.slug);

  return { ok: 'saved' };
}
