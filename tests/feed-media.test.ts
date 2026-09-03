import { describe, expect, it } from 'vitest';
import { validateFeedMedia, MAX_FEED_MEDIA_BYTES } from '@/lib/feed/media-validation';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff, 0xe0];
const WEBP_SIGNATURE = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];

function fileFrom(bytes: number[], type: string, extraSize = 0): File {
  const body = new Uint8Array(bytes.length + extraSize);
  body.set(bytes);
  return new File([body], 'upload', { type });
}

describe('feed media validation', () => {
  it('passes through with no file selected', async () => {
    const result = await validateFeedMedia(null);
    expect(result).toEqual({ ok: true, file: null, detectedType: null });
  });

  it('accepts a real PNG', async () => {
    const file = fileFrom(PNG_SIGNATURE, 'image/png');
    const result = await validateFeedMedia(file);
    expect(result.ok).toBe(true);
    expect(result.ok && result.detectedType).toBe('image/png');
  });

  it('accepts a real WebP', async () => {
    const file = fileFrom(WEBP_SIGNATURE, 'image/webp');
    const result = await validateFeedMedia(file);
    expect(result.ok).toBe(true);
    expect(result.ok && result.detectedType).toBe('image/webp');
  });

  it('accepts a real JPEG', async () => {
    const file = fileFrom(JPEG_SIGNATURE, 'image/jpeg');
    const result = await validateFeedMedia(file);
    expect(result.ok).toBe(true);
    expect(result.ok && result.detectedType).toBe('image/jpeg');
  });

  it('rejects a disallowed declared type outright, before sniffing', async () => {
    const file = fileFrom(PNG_SIGNATURE, 'image/gif');
    const result = await validateFeedMedia(file);
    expect(result).toEqual({ ok: false, reason: 'type' });
  });

  it('rejects a file over the size cap', async () => {
    const file = fileFrom(PNG_SIGNATURE, 'image/png', MAX_FEED_MEDIA_BYTES);
    const result = await validateFeedMedia(file);
    expect(result).toEqual({ ok: false, reason: 'size' });
  });

  // The core attack this guards against: a file whose declared MIME type
  // (fully attacker-controlled) doesn't match its actual byte signature
  // (not attacker-controlled without corrupting the file for real viewers)
  // — e.g. an HTML/SVG/script payload renamed and mislabeled as a PNG.
  it('rejects a declared PNG whose bytes are not actually a PNG', async () => {
    const file = fileFrom([0x3c, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x3e], 'image/png');
    const result = await validateFeedMedia(file);
    expect(result).toEqual({ ok: false, reason: 'signature' });
  });

  it('rejects a declared JPEG whose bytes are actually a PNG (type/signature mismatch)', async () => {
    const file = fileFrom(PNG_SIGNATURE, 'image/jpeg');
    const result = await validateFeedMedia(file);
    expect(result).toEqual({ ok: false, reason: 'signature' });
  });
});
