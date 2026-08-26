'use client';

import { useEffect, useRef } from 'react';
import { config } from '@/lib/config/defaults';

const TILE_SIZE = 200;

/**
 * Rasterized once by the browser on first paint, then reused as a plain
 * bitmap. The "animation" never re-runs feTurbulence — it only nudges
 * background-position, a compositor-only property, so an 8fps flicker
 * costs nothing per frame instead of forcing a filter repaint 8x/sec.
 */
const NOISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='${TILE_SIZE}' height='${TILE_SIZE}'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='7' stitchTiles='stitch' />
  </filter>
  <rect width='100%' height='100%' filter='url(#n)' />
</svg>`;

const NOISE_URL = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`;

// Offsets stay within one tile's bounds so the (seamless, stitched) pattern
// never visibly seams as it steps.
const STEP_OFFSETS: Array<[number, number]> = [
  [0, 0],
  [-53, -31],
  [17, -67],
  [-91, 12],
  [42, 88],
  [-24, -104],
  [88, -19],
  [-67, 61],
];

export function GrainOverlay() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (query.matches) return;

    let frame = 0;
    const intervalMs = 1000 / config('grainFps');
    const id = window.setInterval(() => {
      frame = (frame + 1) % STEP_OFFSETS.length;
      const [x, y] = STEP_OFFSETS[frame];
      node.style.backgroundPosition = `${x}px ${y}px`;
    }, intervalMs);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        backgroundImage: NOISE_URL,
        backgroundRepeat: 'repeat',
        backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
        opacity: config('grainOpacity'),
        mixBlendMode: 'overlay',
      }}
    />
  );
}
