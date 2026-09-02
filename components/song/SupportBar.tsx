'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';
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

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

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
      <div
        ref={sentinel}
        aria-hidden
        className="song-supportbar-sentinel"
      />

      <aside
        aria-label={primaryLabel}
        aria-hidden={!docked}
        data-docked={docked}
        className="song-supportbar"
      >
        <div className="song-supportbar-inner">
          <div className="song-supportbar-summary">
            <p className="song-supportbar-figure">
              {figure}
            </p>

            <p className="song-supportbar-caption">
              {caption}
            </p>
          </div>

          <div
            className={[
              'song-supportbar-actions',
              hasSecondary
                ? 'song-supportbar-actions--dual'
                : '',
            ].join(' ')}
          >
            {secondaryLabel && secondaryHref ? (
              <Link
                href={secondaryHref}
                tabIndex={docked ? undefined : -1}
                className="song-supportbar-link song-supportbar-link--secondary"
              >
                {secondaryLabel}
              </Link>
            ) : null}

            <Link
              href={primaryHref}
              tabIndex={docked ? undefined : -1}
              className="song-supportbar-link song-supportbar-link--primary"
            >
              {primaryLabel}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
