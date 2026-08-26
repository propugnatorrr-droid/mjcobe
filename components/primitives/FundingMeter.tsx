'use client';

import { useEffect, useState } from 'react';
import { config } from '@/lib/config/defaults';
import { useReducedMotion } from '@/lib/motion/useReducedMotion';

/** A pill-shaped fill bar, gold on the track. Animates once on mount. */
export function FundingMeter({ percent }: { percent: number }) {
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Nothing to animate: reduced motion renders `percent` directly below
    // instead of syncing it into state.
    if (reducedMotion) return;
    // Two-frame trick: paint at 0 first, then flip to target so the CSS
    // transition actually animates instead of snapping straight to it.
    const raf = requestAnimationFrame(() => setWidth(percent));
    return () => cancelAnimationFrame(raf);
  }, [percent, reducedMotion]);

  const displayWidth = reducedMotion ? percent : width;
  const transition = reducedMotion
    ? undefined
    : `width ${config('meterAnimationMs')}ms var(--ease-signature)`;

  return (
    <div className="flex w-full items-center gap-4">
      <div className="h-3 w-full overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${displayWidth}%`, background: 'var(--champagne)', transition }}
        />
      </div>
      <span className="font-mono text-body font-medium whitespace-nowrap text-[var(--champagne)]">
        {percent}%
      </span>
    </div>
  );
}
