/**
 * One-shot ingest for delivered artwork. Run with:
 *   npm run assets:ingest
 *
 * Reads the delivery folder, writes sized/format derivatives into
 * public/media/, then upserts `media_assets` rows and links them to the
 * songs / sponsors / journey_events they belong to.
 *
 * Idempotent: re-running replaces the derivative files and updates the same
 * media_assets rows (matched on `path`) rather than duplicating them.
 */
import { mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp, { type Sharp } from 'sharp';
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local', override: true });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, sql } from 'drizzle-orm';
import * as s from '../lib/db/schema';

// A standalone client, like lib/db/seed.ts uses: lib/db/write.ts carries a
// `server-only` guard that throws outside the Next runtime.
const connection = process.env.DATABASE_URL;
if (!connection) throw new Error('DATABASE_URL is not set');
const dbw = drizzle(neon(connection), { schema: s });

const SRC = process.env.ASSET_SRC ?? 'C:/Users/Osman/Downloads/mjcobe new';
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public', 'media');
mkdirSync(OUT, { recursive: true });

const SQUARE_WIDTHS = [640, 1008, 1400];
const WIDE_WIDTHS = [640, 1280, 1792];
const PLACEHOLDER_SIZE = 20;

type Derivatives = Record<string, Record<number, string>>;

async function placeholderFor(src: Sharp): Promise<string> {
  const buf = await src.clone().resize({ width: PLACEHOLDER_SIZE }).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

async function dominantColorFor(src: Sharp): Promise<string> {
  const { data } = await src.clone().resize(1, 1, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(data[0])}${hex(data[1])}${hex(data[2])}`;
}

/** Emits avif/webp/jpeg at each width, never wider than the source. */
async function derive(
  input: Sharp,
  slug: string,
  widths: number[],
  nativeWidth: number,
): Promise<{ derivatives: Derivatives; placeholder: string; dominantColor: string; largest: number }> {
  const derivatives: Derivatives = { avif: {}, webp: {}, jpeg: {} };
  const usable = widths.filter((w) => w <= nativeWidth);
  if (usable.length === 0) usable.push(nativeWidth);

  for (const width of usable) {
    for (const format of ['avif', 'webp', 'jpeg'] as const) {
      const ext = format === 'jpeg' ? 'jpg' : format;
      const filename = `${slug}-${width}.${ext}`;
      const outPath = path.join(OUT, filename);
      const pipeline = input.clone().resize({ width });
      if (format === 'avif') await pipeline.avif({ quality: 55 }).toFile(outPath);
      else if (format === 'webp') await pipeline.webp({ quality: 72 }).toFile(outPath);
      else await pipeline.jpeg({ quality: 78, mozjpeg: true }).toFile(outPath);
      derivatives[format][width] = `/media/${filename}`;
    }
  }

  return {
    derivatives,
    placeholder: await placeholderFor(input),
    dominantColor: await dominantColorFor(input),
    largest: usable[usable.length - 1],
  };
}

/** Upsert on `path` so re-runs update rather than duplicate. */
async function upsertAsset(row: typeof s.mediaAssets.$inferInsert): Promise<string> {
  const [existing] = await dbw
    .select({ id: s.mediaAssets.id })
    .from(s.mediaAssets)
    .where(eq(s.mediaAssets.path, row.path))
    .limit(1);

  if (existing) {
    await dbw.update(s.mediaAssets).set(row).where(eq(s.mediaAssets.id, existing.id));
    return existing.id;
  }
  const [created] = await dbw.insert(s.mediaAssets).values(row).returning({ id: s.mediaAssets.id });
  return created.id;
}

type PhotoJob = {
  file: string;
  /** Resolve against assets/raw instead of the delivery folder. */
  fromRepo?: boolean;
  slug: string;
  role: string;
  altCopyKey: string;
  shape: 'square' | 'wide';
  /** Left offset for cropping a wide source down to square. */
  cropLeft?: number;
  /** Top offset for cropping a tall source down to square. */
  cropTop?: number;
};

const PHOTOS: PhotoJob[] = [
  // Can't Read Your Mind reuses the existing hero portrait, but cropped to a
  // real square so the square slot isn't relying on the browser to crop a
  // 1008x1792 file at render time. Top-weighted to keep the face centred.
  { file: 'hero.png', fromRepo: true, slug: 'cover-cant-read-your-mind', role: 'cover', altCopyKey: 'lookbook.hero_alt', shape: 'square', cropTop: 210 },

  // Song covers
  { file: 'openart-gpt-image-2-edit-1_1787828412589_f6889d1b.webp', slug: 'cover-some-real', role: 'cover', altCopyKey: 'cover.some_real_alt', shape: 'square', cropLeft: 250 },
  { file: 'openart-gpt-image-2-edit-1_1787828546850_8115d485.webp', slug: 'cover-night-shift', role: 'cover', altCopyKey: 'cover.night_shift_alt', shape: 'square' },
  { file: 'openart-gpt-image-2-edit-1_1787828610121_5c2c90de.webp', slug: 'cover-lower-frequency', role: 'cover', altCopyKey: 'cover.lower_frequency_alt', shape: 'square' },

  // Landscape press shots
  { file: 'openart-gpt-image-2-edit-1_1787828582441_88f9eb55.webp', slug: 'press-partners', role: 'hero', altCopyKey: 'press.partners_alt', shape: 'wide' },
  { file: 'openart-gpt-image-2-edit-1_1787828628783_d5e56912.webp', slug: 'press-now', role: 'hero', altCopyKey: 'press.now_alt', shape: 'wide' },

  // Journey timeline
  { file: 'openart-gpt-image-2-edit-1_1787828728231_9ea730f4.webp', slug: 'journey-video-production', role: 'journey', altCopyKey: 'journey.video_production_alt', shape: 'wide' },
  { file: 'openart-gpt-image-2-edit-1_1787828737053_c2a36aa0.webp', slug: 'journey-visual-treatment', role: 'journey', altCopyKey: 'journey.visual_treatment_alt', shape: 'wide' },
  { file: 'openart-gpt-image-2-edit-1_1787828757656_c8f62580.webp', slug: 'journey-campaign-opened', role: 'journey', altCopyKey: 'journey.campaign_opened_alt', shape: 'wide' },
  { file: 'openart-gpt-image-2-edit-1_1787828786472_6bca05cd.webp', slug: 'journey-first-100', role: 'journey', altCopyKey: 'journey.first_100_alt', shape: 'wide' },
  { file: 'openart-gpt-image-2-edit-1_1787828810872_8d675790.webp', slug: 'journey-streams', role: 'journey', altCopyKey: 'journey.streams_alt', shape: 'wide' },
];

const LOGOS: { file: string; sponsorSlug: string; fromRepo?: boolean; absolute?: string }[] = [
  { file: '', absolute: 'C:/Users/Osman/Downloads/lowkey.png', sponsorSlug: 'lowkey-studios' },
  { file: 'image-removebg-preview (1).png', sponsorSlug: 'abc-clothing' },
  { file: 'image-removebg-preview (2).png', sponsorSlug: 'ridgeline-print' },
  { file: 'image-removebg-preview.png', sponsorSlug: 'northbound-coffee' },
  { file: 'image-removebg-preview (4).png', sponsorSlug: 'vellum-eyewear' },
  { file: 'image-removebg-preview (6).png', sponsorSlug: 'halcyon-barbers' },
];

/** Which journey event each image belongs to, matched on its seeded title. */
const JOURNEY_LINKS: { titleLike: string; slug: string }[] = [
  { titleLike: 'music video production', slug: 'journey-video-production' },
  { titleLike: 'Visual treatment locked', slug: 'journey-visual-treatment' },
  { titleLike: 'Campaign opened', slug: 'journey-campaign-opened' },
  { titleLike: 'First 100 supporters', slug: 'journey-first-100' },
  { titleLike: '100,000 streams', slug: 'journey-streams' },
];

const COVER_LINKS: { songSlug: string; slug: string }[] = [
  { songSlug: 'cant-read-your-mind', slug: 'cover-cant-read-your-mind' },
  { songSlug: 'some-real', slug: 'cover-some-real' },
  { songSlug: 'night-shift', slug: 'cover-night-shift' },
  { songSlug: 'lower-frequency', slug: 'cover-lower-frequency' },
];

async function main() {
  const assetIds = new Map<string, string>();

  console.log('Processing photographs…');
  for (const job of PHOTOS) {
    const src = job.fromRepo
      ? path.join(ROOT, 'assets', 'raw', job.file)
      : path.join(SRC, job.file);
    let input = sharp(src);
    const meta = await input.metadata();
    if (!meta.width || !meta.height) throw new Error(`no dimensions for ${job.file}`);

    let width = meta.width;
    let height = meta.height;

    // A 16:9 source destined for a square slot is cropped, never squashed.
    if (job.shape === 'square' && meta.width !== meta.height) {
      const size = Math.min(meta.width, meta.height);
      const left = Math.min(job.cropLeft ?? Math.floor((meta.width - size) / 2), meta.width - size);
      const top = Math.min(job.cropTop ?? Math.floor((meta.height - size) / 2), meta.height - size);
      input = sharp(src).extract({ left, top, width: size, height: size });
      width = size;
      height = size;
    }

    const widths = job.shape === 'square' ? SQUARE_WIDTHS : WIDE_WIDTHS;
    const { derivatives, placeholder, dominantColor, largest } = await derive(
      input, job.slug, widths, width,
    );

    const primary = derivatives.jpeg[largest];
    const id = await upsertAsset({
      kind: 'image',
      role: job.role,
      path: primary,
      derivatives: derivatives as unknown as Record<string, string>,
      width,
      height,
      bytes: statSync(path.join(ROOT, 'public', primary)).size,
      placeholder,
      dominantColor,
      altCopyKey: job.altCopyKey,
    });
    assetIds.set(job.slug, id);
    console.log(`  ${job.slug}  ${width}x${height}  ->  ${primary}`);
  }

  console.log('\nProcessing brand logos…');
  for (const logo of LOGOS) {
    const src = logo.absolute ?? path.join(SRC, 'brands', logo.file);
    const filename = `brand-${logo.sponsorSlug}.png`;
    const outPath = path.join(OUT, filename);
    // Transparency must survive, so logos stay PNG and are only bounded.
    await sharp(src).resize({ width: 600, withoutEnlargement: true }).png().toFile(outPath);
    const meta = await sharp(outPath).metadata();

    const id = await upsertAsset({
      kind: 'logo',
      role: 'logo',
      path: `/media/${filename}`,
      derivatives: {},
      width: meta.width ?? null,
      height: meta.height ?? null,
      bytes: statSync(outPath).size,
      altCopyKey: null,
    });

    await dbw
      .update(s.sponsors)
      .set({ logoAssetId: id })
      .where(eq(s.sponsors.slug, logo.sponsorSlug));
    console.log(`  ${logo.sponsorSlug}  ${meta.width}x${meta.height}`);
  }

  console.log('\nLinking song covers…');
  for (const link of COVER_LINKS) {
    const assetId = assetIds.get(link.slug);
    if (!assetId) continue;
    await dbw.update(s.songs).set({ coverAssetId: assetId }).where(eq(s.songs.slug, link.songSlug));
    console.log(`  ${link.songSlug}`);
  }

  console.log('\nLinking journey events…');
  for (const link of JOURNEY_LINKS) {
    const assetId = assetIds.get(link.slug);
    if (!assetId) continue;
    const res = await dbw
      .update(s.journeyEvents)
      .set({ mediaAssetId: assetId })
      .where(sql`${s.journeyEvents.title} ilike ${'%' + link.titleLike + '%'}`);
    console.log(`  ${link.titleLike}`);
    void res;
  }

  console.log('\nDone.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
