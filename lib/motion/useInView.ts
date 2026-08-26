'use client';

import { useEffect, useRef, useState } from 'react';

/** Fires once, the first time the element enters the viewport. */
export function useInView<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;

    // threshold: 0 — fires the moment any pixel enters, not once 20% of the
    // *target's own* area is visible. That fraction is unreachable for a
    // full-bleed hero taller than the viewport (max ~viewport/target ratio),
    // which silently broke the reveal on exactly that case.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView]);

  return [ref, inView];
}
