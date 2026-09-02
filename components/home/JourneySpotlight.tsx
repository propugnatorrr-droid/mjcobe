import { createElement } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { journeyIcon } from '@/lib/journey/icons';
import type { JourneyEntry } from '@/lib/journey/queries';

type JourneySpotlightProps = {
  entry: JourneyEntry;
  heading: string;
  day: string;
  kindLabel: string;
  cta: string;
};

export function JourneySpotlight({
  entry,
  heading,
  day,
  kindLabel,
  cta,
}: JourneySpotlightProps) {
  return (
    <section
      aria-labelledby="home-journey-heading"
      className="home-journey-spotlight"
    >
      <div className="site-shell">
        <div id="home-journey-heading">
          <SectionHeading>{heading}</SectionHeading>
        </div>

        <article className="home-journey-card">
          {entry.imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.imagePath}
              alt=""
              width={640}
              height={360}
              loading="lazy"
              className="home-journey-card-image"
              style={{
                backgroundColor: 'var(--ink)',
                backgroundImage: entry.imagePlaceholder
                  ? `url("${entry.imagePlaceholder}")`
                  : undefined,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
              }}
            />
          ) : null}

          <div className="home-journey-card-content">
            <div className="home-journey-card-meta">
              {createElement(journeyIcon(entry.kind), {
                'aria-hidden': true,
                size: 15,
                strokeWidth: 1.8,
                color: 'var(--champagne)',
              })}

              <span>{day}</span>

              <span className="home-journey-card-kind">
                {kindLabel}
              </span>
            </div>

            <h3 className="home-journey-card-title">
              {entry.songSlug ? (
                <Link href={`/song/${entry.songSlug}`}>
                  {entry.title}
                </Link>
              ) : (
                entry.title
              )}
            </h3>

            {entry.body ? (
              <p className="home-journey-card-body">
                {entry.body}
              </p>
            ) : null}

            <Link
              href="/journey"
              className="home-journey-card-link"
            >
              <span>{cta}</span>

              <ArrowUpRight
                aria-hidden
                size={15}
                strokeWidth={1.8}
              />
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
