'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/**
 * Docked action bar. It appears only once the hero CTA has scrolled away, so
 * the page opens as a piece of typography rather than as a checkout screen.
 * A sentinel element is observed instead of scroll position — no scroll
 * listener, no layout thrash.
 */
export function SupportBar({
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  figure,
  caption,
}: {
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  figure: string;
  caption: string;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setDocked(!entry.isIntersecting),
      { rootMargin: '0px 0px -100% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden />
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-[var(--ink)] px-6 py-4 md:px-12"
        style={{
          transform: docked ? 'translateY(0)' : 'translateY(100%)',
          transition:
            'transform var(--duration-signature) var(--ease-signature)',
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
          <div className="hidden min-w-0 flex-col gap-1 sm:flex">
            <span className="font-mono text-lg text-[var(--text)]">{figure}</span>
            <span className="truncate font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              {caption}
            </span>
          </div>

          <div className="flex flex-1 gap-3 sm:flex-none">
            <Link
              href={secondaryHref}
              className="inline-flex flex-1 items-center justify-center rounded-[2px] border border-[var(--line-strong)] px-5 py-3 font-ui text-sm uppercase tracking-[0.08em] text-[var(--text)] transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)] sm:flex-none"
            >
              {secondaryLabel}
            </Link>
            <Link
              href={primaryHref}
              className="inline-flex flex-1 items-center justify-center rounded-[2px] bg-[var(--surface-invert)] px-5 py-3 font-ui text-sm uppercase tracking-[0.08em] text-[var(--surface-bg)] transition-colors [transition-duration:var(--duration-signature)] hover:bg-[var(--surface-invert-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)] sm:flex-none"
            >
              {primaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
