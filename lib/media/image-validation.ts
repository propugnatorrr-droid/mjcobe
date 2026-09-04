/**
 * Generic pure signature-sniffing/size/type validation for PNG/WebP/JPEG
 * uploads — shared by every domain that accepts an image (feed
 * submissions, shop product photos, ...). No side-effecting imports, so
 * it's directly unit-testable, matching this repo's convention of testing
 * pure decision functions without a database (see lib/feed/visibility.ts).
 *
 * Extracted from lib/feed/media-validation.ts (Batch D) when Batch I
 * needed the identical logic for shop product photos — a third copy
 * would have been pure duplication. That file now re-exports from here
 * with zero behavior change; its own callers are unaffected.
 */
export type ImageValidation =
  | { ok: true; file: File | null; detectedType: 'image/png' | 'image/webp' | 'image/jpeg' | null }
  | { ok: false; reason: 'type' | 'size' | 'signature' };

export function isPng(bytes: Uint8Array): boolean {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return signature.every((value, index) => bytes[index] === value);
}

export function isWebp(bytes: Uint8Array): boolean {
  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

export function isJpeg(bytes: Uint8Array): boolean {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/webp', 'image/jpeg']);

export async function validateImageUpload(value: FormDataEntryValue | null, maxBytes: number): Promise<ImageValidation> {
  if (!(value instanceof File) || value.size === 0) {
    return { ok: true, file: null, detectedType: null };
  }

  if (!ALLOWED_IMAGE_TYPES.has(value.type)) {
    return { ok: false, reason: 'type' };
  }

  if (value.size > maxBytes) {
    return { ok: false, reason: 'size' };
  }

  const header = new Uint8Array(await value.slice(0, 12).arrayBuffer());
  const detectedType = isPng(header)
    ? 'image/png'
    : isWebp(header)
      ? 'image/webp'
      : isJpeg(header)
        ? 'image/jpeg'
        : null;

  // The declared MIME (attacker-controlled) must agree with the sniffed
  // signature (not attacker-controlled) — same defense-in-depth as
  // lib/media/sponsor-logo.ts.
  if (!detectedType || detectedType !== value.type) {
    return { ok: false, reason: 'signature' };
  }

  return { ok: true, file: value, detectedType };
}
