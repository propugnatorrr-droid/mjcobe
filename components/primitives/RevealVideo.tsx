'use client';

import { copy } from '@/lib/copy/defaults';
import type { LookbookAsset } from '@/lib/lookbook/manifest';
import { useInView } from '@/lib/motion/useInView';
import { useReducedMotion } from '@/lib/motion/useReducedMotion';

type VideoAsset = Extract<LookbookAsset, { kind: 'video' }>;

/**
 * Muted/autoplay/loop loop video. Never the LCP element — the poster
 * (a properly sized AVIF) is what gets measured and is what iOS low-power
 * mode shows when autoplay silently fails, so it has to stand alone.
 * Offscreen instances load nothing (`preload="none"`) until they enter the
 * viewport. Reduced motion renders the poster as a plain image, never a
 * paused <video>.
 */
export function RevealVideo({ asset }: { asset: VideoAsset }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const alt = copy(asset.altKey);

  if (reducedMotion) {
    return (
      <div ref={ref} style={{ aspectRatio: `${asset.width} / ${asset.height}` }}>
        <img
          src={asset.poster.avif}
          width={asset.width}
          height={asset.height}
          alt={alt}
          style={{ backgroundColor: asset.dominantColor }}
          className="block h-auto w-full"
        />
      </div>
    );
  }

  return (
    <div ref={ref} style={{ aspectRatio: `${asset.width} / ${asset.height}` }}>
      {inView ? (
        <video
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
          poster={asset.poster.avif}
          width={asset.width}
          height={asset.height}
          aria-label={alt}
          style={{ backgroundColor: asset.dominantColor }}
          className="block h-auto w-full"
        >
          <source src={asset.webm} type="video/webm" />
          <source src={asset.mp4} type="video/mp4" />
        </video>
      ) : (
        <img
          src={asset.poster.avif}
          width={asset.width}
          height={asset.height}
          alt={alt}
          style={{ backgroundColor: asset.dominantColor }}
          className="block h-auto w-full"
        />
      )}
    </div>
  );
}
