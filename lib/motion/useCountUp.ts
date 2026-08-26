'use client';

import { useEffect, useState } from 'react';
import { config } from '@/lib/config/defaults';
import { signatureEase } from './bezier';
import { useInView } from './useInView';
import { useReducedMotion } from './useReducedMotion';

/** Shared animation core for CountUp — money and plain-integer variants
 * both interpolate through the same signature-eased timeline. */
export function useCountUp(target: number) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const reducedMotion = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    // Nothing to animate: reduced motion renders `target` directly below
    // instead of syncing it into state.
    if (!inView || reducedMotion) return;

    const durationMs = config('meterAnimationMs');
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = signatureEase(progress);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reducedMotion, target]);

  return { ref, value: reducedMotion ? target : value };
}
