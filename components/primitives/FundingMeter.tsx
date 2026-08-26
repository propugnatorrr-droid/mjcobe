'use client';

import { useEffect, useState } from 'react';
import { config } from '@/lib/config/defaults';
import { useReducedMotion } from '@/lib/motion/useReducedMotion';

const TICKS = [10, 20, 30, 40, 50, 60, 70, 80, 90];

/** A 2px timecode rule, not a progress pill. Animates once on mount. */
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
    <div className="w-full">
      <div className="mb-2 flex justify-end" style={{ width: `${displayWidth}%`, transition }}>
        <span className="font-mono text-eyebrow text-[var(--text)]">{percent}%</span>
      </div>
      <div className="relative h-0.5 w-full" style={{ background: 'var(--line)' }}>
        {TICKS.map((tick) => (
          <span
            key={tick}
            className="absolute top-0 w-px"
            style={{
              left: `${tick}%`,
              height: tick === 50 ? '10px' : '6px',
              background: 'var(--text-faint)',
            }}
          />
        ))}
        <div
          className="absolute top-0 left-0 h-0.5"
          style={{ width: `${displayWidth}%`, background: 'var(--ember)', transition }}
        />
      </div>
    </div>
  );
}
