/**
 * Feed-specific wrapper around the generic lib/media/image-validation.ts
 * (extracted in Batch I when shop product photos needed the identical
 * logic — see that file's header comment). Public API unchanged from
 * Batch D: same export names, same MAX_FEED_MEDIA_BYTES cap, same
 * behavior — existing callers (lib/feed/media.ts, lib/feed/
 * admin-actions.ts, lib/feed/submission-actions.ts) needed no changes.
 */
import { validateImageUpload, isPng, isWebp, isJpeg, type ImageValidation } from '@/lib/media/image-validation';

export const MAX_FEED_MEDIA_BYTES = 5 * 1024 * 1024;

export { isPng, isWebp, isJpeg };

export type FeedMediaValidation = ImageValidation;

export async function validateFeedMedia(value: FormDataEntryValue | null): Promise<FeedMediaValidation> {
  return validateImageUpload(value, MAX_FEED_MEDIA_BYTES);
}
