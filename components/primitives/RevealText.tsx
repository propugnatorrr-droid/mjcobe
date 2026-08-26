'use client';

import { useInView } from '@/lib/motion/useInView';
import { useReducedMotion } from '@/lib/motion/useReducedMotion';
import { config } from '@/lib/config/defaults';

/** Each line masked under overflow-hidden, staggered on viewport entry. */
export function RevealText({
  lines,
  className,
}: {
  lines: string[];
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reducedMotion = useReducedMotion();
  const revealed = reducedMotion || inView;

  return (
    <div ref={ref}>
      {lines.map((line, index) => (
        <div key={line} className="overflow-hidden">
          <span
            className={`block ${className ?? ''}`}
            style={{
              transform: revealed ? 'translateY(0)' : 'translateY(100%)',
              transition: reducedMotion
                ? undefined
                : 'transform var(--duration-signature) var(--ease-signature)',
              transitionDelay: reducedMotion
                ? undefined
                : `${index * config('revealTextStaggerMs')}ms`,
            }}
          >
            {line}
          </span>
        </div>
      ))}
    </div>
  );
}
