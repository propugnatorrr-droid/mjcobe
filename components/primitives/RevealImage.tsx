'use client';

import { useInView } from '@/lib/motion/useInView';
import { useReducedMotion } from '@/lib/motion/useReducedMotion';

/** Wraps arbitrary media; wipes left-to-right on viewport entry. */
export function RevealImage({ children }: { children: React.ReactNode }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const revealed = reducedMotion || inView;

  return (
    <div
      ref={ref}
      style={{
        clipPath: revealed ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
        transition: reducedMotion
          ? undefined
          : 'clip-path var(--duration-signature) var(--ease-signature)',
      }}
    >
      {children}
    </div>
  );
}
