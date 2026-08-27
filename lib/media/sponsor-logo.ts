import 'server-only';

import { put } from '@vercel/blob';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const ALLOWED_LOGO_TYPES = new Set([
  'image/png',
  'image/webp',
]);

export type SponsorLogoValidation =
  | {
      ok: true;
      file: File | null;
    }
  | {
      ok: false;
      reason: 'type' | 'size';
    };

export function validateSponsorLogo(
  value: FormDataEntryValue | null,
): SponsorLogoValidation {
  if (!(value instanceof File) || value.size === 0) {
    return {
      ok: true,
      file: null,
    };
  }

  if (!ALLOWED_LOGO_TYPES.has(value.type)) {
    return {
      ok: false,
      reason: 'type',
    };
  }

  if (value.size > MAX_LOGO_BYTES) {
    return {
      ok: false,
      reason: 'size',
    };
  }

  return {
    ok: true,
    file: value,
  };
}

function safeFileName(name: string): string {
  const extension = name
    .toLowerCase()
    .endsWith('.webp')
    ? 'webp'
    : 'png';

  const base = name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  return `${base || 'sponsor-logo'}.${extension}`;
}

export async function storeSponsorLogo(
  file: File,
): Promise<string> {
  const pathname = [
    'sponsor-logos',
    `${Date.now()}-${safeFileName(file.name)}`,
  ].join('/');

  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  const [asset] = await dbw
    .insert(s.mediaAssets)
    .values({
      kind: 'logo',
      role: 'logo',
      path: blob.url,
      bytes: file.size,
      derivatives: {},
    })
    .returning({
      id: s.mediaAssets.id,
    });

  if (!asset) {
    throw new Error('Sponsor logo asset was not created');
  }

  return asset.id;
}
