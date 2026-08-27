import 'server-only';
import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import type { CopyKey } from '@/lib/copy/defaults';

/**
 * DB-backed images shaped exactly like a manifest entry, so `LookbookImage`
 * renders either source without knowing the difference. The manifest stays
 * the home of the original lookbook set; anything ingested later lives in
 * `media_assets` and comes through here.
 */
export type DbImageAsset = {
  id: string;
  kind: 'image';
  width: number;
  height: number;
  altKey: CopyKey;
  placeholder: string;
  dominantColor: string;
  derivatives: {
    avif: Record<number, string>;
    webp: Record<number, string>;
    jpeg: Record<number, string>;
  };
};

type RawDerivatives = Record<string, Record<string, string>>;

function toWidthMap(raw: Record<string, string> | undefined): Record<number, string> {
  const out: Record<number, string> = {};
  for (const [k, v] of Object.entries(raw ?? {})) out[Number(k)] = v;
  return out;
}

/** Null rather than throwing: a missing image must degrade to an empty
 * state, never take a page down. */
export const getImageByPath = cache(async (path: string): Promise<DbImageAsset | null> => {
  const [row] = await db
    .select()
    .from(s.mediaAssets)
    .where(eq(s.mediaAssets.path, path))
    .limit(1);

  if (!row || !row.width || !row.height) return null;

  const raw = (row.derivatives ?? {}) as unknown as RawDerivatives;
  const derivatives = {
    avif: toWidthMap(raw.avif),
    webp: toWidthMap(raw.webp),
    jpeg: toWidthMap(raw.jpeg),
  };

  // Without derivatives there is nothing for the <picture> to point at.
  if (Object.keys(derivatives.jpeg).length === 0) return null;

  return {
    id: row.id,
    kind: 'image',
    width: row.width,
    height: row.height,
    altKey: (row.altCopyKey ?? 'lookbook.hero_alt') as CopyKey,
    placeholder: row.placeholder ?? '',
    dominantColor: row.dominantColor ?? '#0a0a0b',
    derivatives,
  };
});
