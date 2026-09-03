import 'server-only';

import { del, put } from '@vercel/blob';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';

/**
 * Feed media upload — images only. Video is deliberately NOT supported here:
 * this app has no video transcoding/streaming infrastructure, no player
 * component, and no moderation tooling for scanning video content before
 * it's public. Building that safely is out of scope for this batch. The
 * `brand_feed_posts.postType` enum still allows 'video' at the data layer
 * (an admin could theoretically hand-craft a row pointing `ctaUrl` at an
 * external video link), but neither the admin form nor the public
 * submission form offer 'video' as a selectable option, and this module
 * exposes no path to store a video asset. Documented here rather than
 * half-built: revisit if/when video is actually prioritized.
 *
 * Signature/size/type validation lives in media-validation.ts (no
 * 'server-only', no DB/Blob) so it can be unit-tested directly — re-exported
 * here so existing callers can keep importing everything from this module.
 */
export { validateFeedMedia, MAX_FEED_MEDIA_BYTES } from './media-validation';
export type { FeedMediaValidation } from './media-validation';

function safeFileName(name: string, type: 'image/png' | 'image/webp' | 'image/jpeg'): string {
  const extension = type === 'image/webp' ? 'webp' : type === 'image/jpeg' ? 'jpg' : 'png';
  const base = name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  return `${base || 'feed-media'}.${extension}`;
}

/**
 * Stores a validated feed image and returns the new media_assets row id.
 * `role` is always 'feed-pending' at upload time regardless of source
 * (admin or brand-invite submission) — nothing uploaded through this
 * function is implicitly public. A post only becomes visible once its own
 * moderation is 'approved' (see lib/feed/visibility.ts); the asset's role
 * is not itself a gate; it's descriptive/for cleanup purposes only.
 */
export async function storeFeedMedia(file: File, detectedType: 'image/png' | 'image/webp' | 'image/jpeg'): Promise<string> {
  const pathname = ['feed-media', `${Date.now()}-${safeFileName(file.name, detectedType)}`].join('/');

  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: detectedType,
  });

  try {
    const [asset] = await dbw
      .insert(s.mediaAssets)
      .values({
        kind: 'image',
        role: 'feed-pending',
        path: blob.url,
        bytes: file.size,
        derivatives: {},
      })
      .returning({ id: s.mediaAssets.id });

    if (!asset) {
      throw new Error('Feed media asset was not created');
    }

    return asset.id;
  } catch (error) {
    await del(blob.url).catch(() => {
      // The database remains authoritative; orphan Blob cleanup can retry later.
    });
    throw error;
  }
}
