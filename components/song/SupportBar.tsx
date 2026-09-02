'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type SupportBarProps = {
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  figure: string;
  caption: string;
};

export function SupportBar({
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  figure,
  caption,
}: SupportBarProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [docked, setDocked] = useState(false);

  const hasSecondary = Boolean(
    secondaryLabel && secondaryHref,
  );

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setDocked(!entry.isIntersecting);
      },
      {
        rootMargin: '0px 0px -100% 0px',
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden />

      <aside
        aria-hidden={!docked}
className={[
  'song-supportbar',
  'fixed inset-x-0 bottom-0 z-40',
          'border-t border-[var(--line)]',
          'bg-[rgba(10,10,11,0.98)]',
          'px-4 pt-3 sm:px-6 lg:px-10',
        ].join(' ')}
        style={{
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          transform: docked
            ? 'translateY(0)'
            : 'translateY(110%)',
          visibility: docked ? 'visible' : 'hidden',
          transition:
            'transform var(--duration-signature) var(--ease-signature), visibility var(--duration-signature)',
        }}
      >
        <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-6">
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="numeric font-serif text-xl leading-none text-gold">
              {figure}
            </p>

            <p className="mt-1 truncate text-[0.625rem] font-medium uppercase tracking-[0.16em] text-[var(--text-dim)]">
              {caption}
            </p>
          </div>

          <div
            className={[
              'grid w-full gap-2 md:flex md:w-auto',
              hasSecondary ? 'grid-cols-2' : 'grid-cols-1',
            ].join(' ')}
          >
            {secondaryLabel && secondaryHref ? (
              <Link
                href={secondaryHref}
                className={[
                  'inline-flex min-h-12 items-center justify-center',
                  'rounded-full border border-[var(--champagne)]',
                  'px-4 py-3',
                  'text-center font-ui text-[0.625rem] font-semibold uppercase',
                  'tracking-[0.1em] text-[var(--champagne)]',
                  'transition-[color,background-color]',
                  '[transition-duration:var(--duration-signature)]',
                  'hover:bg-[rgba(201,162,39,0.09)]',
                  'sm:px-6 sm:text-xs',
                ].join(' ')}
              >
                {secondaryLabel}
              </Link>
            ) : null}

            <Link
              href={primaryHref}
              className={[
                'bg-gold',
                'inline-flex min-h-12 items-center justify-center',
                'rounded-full px-4 py-3',
                'text-center font-ui text-[0.625rem] font-semibold uppercase',
                'tracking-[0.1em] text-[var(--ink)]',
                'transition-[filter,transform]',
                '[transition-duration:var(--duration-signature)]',
                'hover:brightness-110 active:translate-y-px',
                'sm:px-6 sm:text-xs',
              ].join(' ')}
              style={{
                boxShadow: 'var(--glow-champagne)',
              }}
            >
              {primaryLabel}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
