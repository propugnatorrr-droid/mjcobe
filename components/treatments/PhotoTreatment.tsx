import { config } from '@/lib/config/defaults';

const GRAIN_TILE = 160;

const GRAIN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='${GRAIN_TILE}' height='${GRAIN_TILE}'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='11' stitchTiles='stitch' />
  </filter>
  <rect width='100%' height='100%' filter='url(#n)' />
</svg>`;
const GRAIN_URL = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`;

/**
 * Reusable treatment layers over real imagery — grain, vignette, duotone.
 * Never baked into the derivative files, so one grade applies uniformly and
 * stays tunable. See docs/DESIGN.md's Texture section: a photographic
 * vignette/duotone here is the sanctioned exception to the banned-gradient
 * rule, which targets decorative UI gradients, not photo grading.
 */
export function PhotoTreatment({
  children,
  vignette = true,
  grain = true,
  duotone = false,
}: {
  children: React.ReactNode;
  vignette?: boolean;
  grain?: boolean;
  duotone?: boolean;
}) {
  return (
    <div className="relative overflow-hidden">
      {children}

      {grain && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: GRAIN_URL,
            backgroundRepeat: 'repeat',
            backgroundSize: `${GRAIN_TILE}px ${GRAIN_TILE}px`,
            opacity: config('photoGrainOpacity'),
            mixBlendMode: 'overlay',
          }}
        />
      )}

      {vignette && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,${config('photoVignetteDarken')}) 100%)`,
          }}
        />
      )}

      {duotone && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(0deg, var(--ink) 0%, var(--paper) 100%)',
            mixBlendMode: 'color',
            opacity: 0.85,
          }}
        />
      )}
    </div>
  );
}
