import { copy } from '@/lib/copy/defaults';
import type { LookbookAsset } from '@/lib/lookbook/manifest';

/** Manifest entries and DB-backed rows share this shape by construction —
 * see lib/media/queries.ts. */
type ImageAsset = Extract<LookbookAsset, { kind: 'image' }>;

/** Renders one manifest image asset as a responsive <picture>, never wider
 * than its native derivatives (see the Slice 0.5 resolution-inventory gate). */
export function LookbookImage({
  asset,
  sizes,
  className = 'block h-auto w-full',
  objectPosition,
  priority = false,
}: {
  asset: ImageAsset;
  sizes: string;
  /** Override when the image must fill a fixed-height band rather than flow. */
  className?: string;
  objectPosition?: string;
  priority?: boolean;
}) {
  const widths = Object.keys(asset.derivatives.avif)
    .map(Number)
    .sort((a, b) => a - b);
  const largest = widths[widths.length - 1];

  const srcSet = (format: 'avif' | 'webp' | 'jpeg') =>
    widths.map((w) => `${asset.derivatives[format][w]} ${w}w`).join(', ');

  return (
    <picture className={className.includes('absolute') ? 'contents' : undefined}>
      <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
      <img
        src={asset.derivatives.jpeg[largest]}
        srcSet={srcSet('jpeg')}
        sizes={sizes}
        width={asset.width}
        height={asset.height}
        alt={copy(asset.altKey)}
        style={{ backgroundColor: asset.dominantColor, objectPosition }}
        className={className}
        fetchPriority={priority ? 'high' : undefined}
        loading={priority ? 'eager' : undefined}
      />
    </picture>
  );
}
