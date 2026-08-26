/**
 * Client-safe lookbook registry — paths, dimensions, placeholders, alt-text
 * keys. Shaped to become the `lookbook_assets` table later. Generation
 * metadata (model, prompt, seed, references) lives in `manifest.server.ts`
 * instead, which is `server-only` — prompts never belong in the client
 * bundle. `RevealImage`/`RevealVideo` import only from this file.
 */
import type { CopyKey } from '@/lib/copy/defaults';

type ImageAsset = {
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

type VideoAsset = {
  id: string;
  kind: 'video';
  width: number;
  height: number;
  altKey: CopyKey;
  placeholder: string;
  dominantColor: string;
  webm: string;
  mp4: string;
  poster: { avif: string; webp: string; jpg: string };
};

export type LookbookAsset = ImageAsset | VideoAsset;

export const lookbookAssets: LookbookAsset[] = [
  {
    id: 'hero',
    kind: 'image',
    width: 1008,
    height: 1792,
    altKey: 'lookbook.hero_alt',
    dominantColor: 'rgb(17, 31, 33)',
    placeholder:
      'data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAANZtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAACJpbG9jAAAAAERAAAEAAQAAAAAA+gABAAAAAAAAAGkAAAAjaWluZgAAAAAAAQAAABVpbmZlAgAAAAABAABhdjAxAAAAAA5waXRtAAAAAAABAAAAVmlwcnAAAAA4aXBjbwAAAAxhdjFDgSACAAAAABRpc3BlAAAAAAAAABQAAAAkAAAAEHBpeGkAAAAAAwgICAAAABZpcG1hAAAAAAAAAAEAAQOBAgMAAABxbWRhdBIACgk4EWcbSAhoNIAyWhxCYuTjDCEBY4jA7pPM7PU6sSdJTvLsUi/AJGkcWdkibvwVeC/Y4MHk/P8gba8nlmuNmznBBa2ONJuQx6VTATqLF7Cr/A39H0ITPZfkcFYyk6kIxOOTd+N5UA==',
    derivatives: {
      avif: { 640: '/media/hero-640.avif', 1008: '/media/hero-1008.avif' },
      webp: { 640: '/media/hero-640.webp', 1008: '/media/hero-1008.webp' },
      jpeg: { 640: '/media/hero-640.jpg', 1008: '/media/hero-1008.jpg' },
    },
  },
  {
    id: 'loop',
    kind: 'video',
    width: 1280,
    height: 720,
    altKey: 'lookbook.loop_alt',
    dominantColor: 'rgb(4, 18, 34)',
    placeholder:
      'data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAANZtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAACJpbG9jAAAAAERAAAEAAQAAAAAA+gABAAAAAAAAAEAAAAAjaWluZgAAAAAAAQAAABVpbmZlAgAAAAABAABhdjAxAAAAAA5waXRtAAAAAAABAAAAVmlwcnAAAAA4aXBjbwAAAAxhdjFDgSACAAAAABRpc3BlAAAAAAAAABQAAAALAAAAEHBpeGkAAAAAAwgICAAAABZpcG1hAAAAAAAAAAEAAQOBAgMAAABIbWRhdBIACgg4EOdNICGg0jIyHEJi5OAAFiLs8cxkecnRO91EbhJaGKhB9BOI11z1+EWIYsrGARLdCm3W6m53hbY51kA=',
    webm: '/media/loop.webm',
    mp4: '/media/loop.mp4',
    poster: {
      avif: '/media/loop-poster.avif',
      webp: '/media/loop-poster.webp',
      jpg: '/media/loop-poster.jpg',
    },
  },
];

export function getLookbookAsset(id: string): LookbookAsset {
  const asset = lookbookAssets.find((a) => a.id === id);
  if (!asset) throw new Error(`Unknown lookbook asset: ${id}`);
  return asset;
}

export function getLookbookImage(id: string): ImageAsset {
  const asset = getLookbookAsset(id);
  if (asset.kind !== 'image') throw new Error(`Lookbook asset "${id}" is not an image`);
  return asset;
}

export function getLookbookVideo(id: string): VideoAsset {
  const asset = getLookbookAsset(id);
  if (asset.kind !== 'video') throw new Error(`Lookbook asset "${id}" is not a video`);
  return asset;
}
