import 'server-only';
import { del, put } from '@vercel/blob';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { validateImageUpload } from '@/lib/media/image-validation';

export const MAX_PRODUCT_MEDIA_BYTES = 5 * 1024 * 1024;

export async function validateProductMedia(value: FormDataEntryValue | null) {
  return validateImageUpload(value, MAX_PRODUCT_MEDIA_BYTES);
}

function safeFileName(name: string, type: 'image/png' | 'image/webp' | 'image/jpeg'): string {
  const extension = type === 'image/webp' ? 'webp' : type === 'image/jpeg' ? 'jpg' : 'png';
  const base = name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  return `${base || 'product-media'}.${extension}`;
}

/** Stores a validated product image and returns the new media_assets row
 * id — the caller (lib/shop/admin-actions.ts) links it to a product via
 * product_media. Public from the moment it's attached; there's no
 * moderation queue for admin-authored shop content, unlike brand feed
 * submissions. */
export async function storeProductMedia(file: File, detectedType: 'image/png' | 'image/webp' | 'image/jpeg'): Promise<string> {
  const pathname = ['product-media', `${Date.now()}-${safeFileName(file.name, detectedType)}`].join('/');

  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: detectedType,
  });

  try {
    const [asset] = await dbw
      .insert(s.mediaAssets)
      .values({ kind: 'image', role: 'product', path: blob.url, bytes: file.size, derivatives: {} })
      .returning({ id: s.mediaAssets.id });

    if (!asset) {
      throw new Error('Product media asset was not created');
    }

    return asset.id;
  } catch (error) {
    await del(blob.url).catch(() => {
      // The database remains authoritative; orphan Blob cleanup can retry later.
    });
    throw error;
  }
}
