/**
 * Asset derivative pipeline for the lookbook. Run with:
 *   node --experimental-strip-types scripts/process-assets.ts
 *
 * Reads assets/raw/{hero.png,loop.mp4} (never committed — see .gitignore),
 * writes sized/format derivatives to public/media/, and prints a JSON
 * summary (dimensions, byte sizes, placeholders) to paste into
 * lib/lookbook/manifest.ts. Never generates a derivative wider than the
 * source's native width — see docs/DESIGN.md and the Slice 0.5 plan.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW = path.join(ROOT, 'assets', 'raw');
const OUT = path.join(ROOT, 'public', 'media');
mkdirSync(OUT, { recursive: true });

const HERO_WIDTHS = [640, 1008]; // capped at native width — see config.heroImageWidths
const PLACEHOLDER_SIZE = 20;
const VIDEO_MAX_BYTES = 1_000_000;

function bytes(file: string): number {
  return statSync(file).size;
}

function fmtKB(n: number): string {
  return `${(n / 1024).toFixed(1)}KB`;
}

async function processHero() {
  const src = path.join(RAW, 'hero.png');
  const image = sharp(src);
  const meta = await image.metadata();
  console.log(`\nhero.png native: ${meta.width}x${meta.height}`);

  const derivatives: Record<string, Record<number, string>> = {
    avif: {},
    webp: {},
    jpeg: {},
  };
  const sizes: Record<string, number> = {};

  for (const width of HERO_WIDTHS) {
    for (const format of ['avif', 'webp', 'jpeg'] as const) {
      const filename = `hero-${width}.${format === 'jpeg' ? 'jpg' : format}`;
      const outPath = path.join(OUT, filename);
      const pipeline = sharp(src).resize({ width });
      if (format === 'avif') await pipeline.avif({ quality: 55 }).toFile(outPath);
      else if (format === 'webp') await pipeline.webp({ quality: 70 }).toFile(outPath);
      else await pipeline.jpeg({ quality: 75, mozjpeg: true }).toFile(outPath);
      derivatives[format][width] = `/media/${filename}`;
      sizes[filename] = bytes(outPath);
      console.log(`  ${filename}: ${fmtKB(sizes[filename])}`);
    }
  }

  // Dominant color: shrink to 1x1 and read the resulting pixel.
  const { data } = await sharp(src).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  const dominantColor = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;

  // Tiny inline placeholder: ~20px-wide AVIF, base64-embedded — costs zero
  // extra JS (no client-side decode library), unlike blurhash.
  const tinyBuffer = await sharp(src)
    .resize({ width: PLACEHOLDER_SIZE })
    .avif({ quality: 30 })
    .toBuffer();
  const placeholder = `data:image/avif;base64,${tinyBuffer.toString('base64')}`;

  return {
    width: meta.width,
    height: meta.height,
    derivatives,
    dominantColor,
    placeholder,
    placeholderBytes: tinyBuffer.length,
  };
}

function ffprobe(file: string, entries: string): string {
  return execFileSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', entries,
    '-of', 'default=noprint_wrappers=1:nokey=1',
    file,
  ]).toString().trim();
}

async function processLoop() {
  const src = path.join(RAW, 'loop.mp4');
  const width = Number(ffprobe(src, 'stream=width'));
  const height = Number(ffprobe(src, 'stream=height'));
  console.log(`\nloop.mp4 native: ${width}x${height}`);

  // No audio track in the delivered files — RevealVideo is always muted,
  // so keeping audio would only cost bytes against the 1MB budget.
  const webmPath = path.join(OUT, 'loop.webm');
  const targetBitrateKbps = Math.floor((VIDEO_MAX_BYTES * 8) / 4.1 / 1000); // ~4.1s clip
  execFileSync('ffmpeg', [
    '-y', '-v', 'error', '-i', src,
    '-an', '-map_metadata', '-1',
    '-c:v', 'libsvtav1', '-b:v', `${targetBitrateKbps}k`,
    '-pix_fmt', 'yuv420p', '-preset', '6',
    webmPath,
  ]);

  const mp4Path = path.join(OUT, 'loop.mp4');
  execFileSync('ffmpeg', [
    '-y', '-v', 'error', '-i', src,
    '-an', '-map_metadata', '-1',
    '-c:v', 'libx264', '-b:v', `${targetBitrateKbps}k`,
    '-pix_fmt', 'yuv420p', '-preset', 'slow', '-movflags', '+faststart',
    mp4Path,
  ]);

  // Poster = first frame, exact match, so there's no flash between poster
  // and video start.
  const posterPngPath = path.join(OUT, '_poster-raw.png');
  execFileSync('ffmpeg', [
    '-y', '-v', 'error', '-i', src,
    '-frames:v', '1', '-map_metadata', '-1',
    posterPngPath,
  ]);
  const posterAvif = path.join(OUT, 'loop-poster.avif');
  const posterWebp = path.join(OUT, 'loop-poster.webp');
  const posterJpg = path.join(OUT, 'loop-poster.jpg');
  await sharp(posterPngPath).avif({ quality: 60 }).toFile(posterAvif);
  await sharp(posterPngPath).webp({ quality: 75 }).toFile(posterWebp);
  await sharp(posterPngPath).jpeg({ quality: 80, mozjpeg: true }).toFile(posterJpg);

  const tinyBuffer = await sharp(posterPngPath)
    .resize({ width: PLACEHOLDER_SIZE })
    .avif({ quality: 30 })
    .toBuffer();
  const placeholder = `data:image/avif;base64,${tinyBuffer.toString('base64')}`;
  const { data } = await sharp(posterPngPath).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  const dominantColor = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;

  execFileSync('rm', [posterPngPath]);

  const webmBytes = bytes(webmPath);
  const mp4Bytes = bytes(mp4Path);
  console.log(`  loop.webm: ${fmtKB(webmBytes)} (budget ${fmtKB(VIDEO_MAX_BYTES)})`);
  console.log(`  loop.mp4: ${fmtKB(mp4Bytes)}`);
  console.log(`  loop-poster.avif: ${fmtKB(bytes(posterAvif))}`);
  console.log(`  loop-poster.webp: ${fmtKB(bytes(posterWebp))}`);
  console.log(`  loop-poster.jpg: ${fmtKB(bytes(posterJpg))}`);

  if (webmBytes > VIDEO_MAX_BYTES) {
    console.warn(
      `  WARNING: loop.webm (${fmtKB(webmBytes)}) exceeds the ${fmtKB(VIDEO_MAX_BYTES)} budget.`,
    );
  }

  return {
    width,
    height,
    webm: '/media/loop.webm',
    mp4: '/media/loop.mp4',
    poster: { avif: '/media/loop-poster.avif', webp: '/media/loop-poster.webp', jpg: '/media/loop-poster.jpg' },
    dominantColor,
    placeholder,
    webmBytes,
    mp4Bytes,
  };
}

const hero = await processHero();
const loop = await processLoop();

console.log('\n--- summary for lib/lookbook/manifest.ts ---');
console.log(JSON.stringify({ hero: { ...hero, placeholder: `${hero.placeholder.slice(0, 40)}...(${hero.placeholderBytes}b)` }, loop: { ...loop, placeholder: `${loop.placeholder.slice(0, 40)}...` } }, null, 2));

writeFileSync(
  path.join(OUT, '_manifest-data.json'),
  JSON.stringify({ hero, loop }, null, 2),
);
console.log(`\nFull data (incl. full placeholder strings) written to public/media/_manifest-data.json`);
