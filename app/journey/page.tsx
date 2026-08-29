import Link from 'next/link';
import { Crown } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileCta } from '@/components/MobileCta';
import { formatDay } from '@/lib/song/queries';
import { getGlobalJourney, journeyGroup, type JourneyFilter } from '@/lib/journey/queries';
import { journeyIcon } from '@/lib/journey/icons';
import { text } from '@/lib/copy/site-copy';
import type { CopyKey } from '@/lib/copy/defaults';

export const revalidate = 60;

const FILTERS: JourneyFilter[] = ['all', 'milestones', 'supporters', 'sponsors'];

export default async function JourneyPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter: JourneyFilter = FILTERS.includes(rawFilter as JourneyFilter)
    ? (rawFilter as JourneyFilter)
    : 'all';

  const [entries, title, sub, empty, ...filterLabels] = await Promise.all([
    getGlobalJourney(),
    text('journey.page.title'),
    text('journey.page.sub'),
    text('journey.page.empty'),
    text('journey.filter.all'),
    text('journey.filter.milestones'),
    text('journey.filter.supporters'),
    text('journey.filter.sponsors'),
  ]);

  const visible =
    filter === 'all' ? entries : entries.filter((e) => journeyGroup(e.kind) === filter);

  return (
    <main className="story-v4-page journey-v4-page surface-ink min-h-screen">
      <SiteNav sub="THE JOURNEY" />

      {/* Title band */}
<section
  className="journey-v4-hero border-b py-14"
  style={{ borderColor: 'var(--line)' }}
>
        <div className="mx-auto max-w-[92rem] px-6 text-center md:px-10">
          <h1 className="font-display text-[clamp(2.5rem,8vw,6rem)] uppercase leading-none text-gold">
            {title}
          </h1>
          <Crown aria-hidden size={18} color="var(--champagne)" className="mx-auto mt-5" />
          <p className="mt-5 font-serif text-lg italic text-[var(--text-dim)]">{sub}</p>
        </div>
      </section>

      <div className="journey-v4-shell">
        {/* Filters, right-aligned as in the mockup */}
        <div className="journey-v4-filters flex flex-wrap justify-center gap-3 lg:justify-end">
          {FILTERS.map((f, i) => (
            <Link
              key={f}
              href={f === 'all' ? '/journey' : `/journey?filter=${f}`}
              className="rounded-full border px-5 py-2 font-ui text-[0.625rem] uppercase tracking-[0.18em] transition-colors [transition-duration:var(--duration-signature)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
              style={
                filter === f
                  ? { borderColor: 'var(--champagne)', color: 'var(--champagne)' }
                  : { borderColor: 'var(--line)', color: 'var(--text-dim)' }
              }
            >
              {filterLabels[i]}
            </Link>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="mt-16 text-center text-body text-[var(--text-dim)]">{empty}</p>
        ) : (
          /* Centre spine with events alternating left/right on wide screens. */
          <ol className="journey-v4-timeline relative mt-12">
            <span
              aria-hidden
              className="absolute inset-y-0 left-4 w-px lg:left-1/2 lg:-translate-x-1/2"
              style={{ background: 'var(--line-strong)' }}
            />

            {await Promise.all(
              visible.map(async (event, i) => {
                const Icon = journeyIcon(event.kind);
                const right = i % 2 === 1;

                return (
<li
  key={event.id}
  className="journey-v4-event relative pb-8 last:pb-0"
>
                    <span
                      aria-hidden
                      className="absolute left-4 top-6 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border lg:left-1/2"
                      style={{
                        borderColor: 'var(--champagne)',
                        background: 'var(--ink)',
                        boxShadow: 'var(--glow-champagne)',
                      }}
                    >
                      <Icon size={15} color="var(--champagne)" />
                    </span>

                    <div
                      className={`pl-12 lg:w-[calc(50%-3rem)] lg:pl-0 ${
                        right ? 'lg:ml-auto lg:pl-12' : 'lg:pr-12 lg:text-right'
                      }`}
                    >
                      <div
                        className="journey-v4-card overflow-hidden rounded-[var(--radius-panel)] border"
                        style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
                      >
                        {event.imagePath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={event.imagePath}
                            alt=""
                            width={640}
                            height={360}
                            loading="lazy"
                            className="aspect-video w-full object-cover"
                            style={{ background: 'var(--ink)' }}
                          />
                        ) : null}
                        <div className="p-5">
                        <div
                          className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 ${
                            right ? '' : 'lg:justify-end'
                          }`}
                        >
                          <span className="font-ui text-[0.625rem] uppercase tracking-[0.2em] text-[var(--champagne)]">
                            {await formatDay(event.occurredAt)}
                          </span>
                          <span className="font-ui text-[0.625rem] uppercase tracking-[0.2em] text-[var(--text-faint)]">
                            {await text(`journey.kind.${event.kind}` as CopyKey)}
                          </span>
                        </div>

                        <p className="mt-2 font-display text-lg uppercase tracking-[0.02em] text-[var(--text)]">
                          {event.songSlug ? (
                            <Link
                              href={`/song/${event.songSlug}`}
                              className="hover:text-[var(--champagne)]"
                            >
                              {event.title}
                            </Link>
                          ) : (
                            event.title
                          )}
                        </p>

                        {event.body ? (
                          <p className="mt-2 text-body text-[var(--text-dim)]">{event.body}</p>
                        ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              }),
            )}
          </ol>
        )}

        <div className="mt-14 flex items-center gap-6">
          <span className="rule-gold h-px flex-1 opacity-40" />
          <Crown aria-hidden size={16} color="var(--champagne)" />
          <span className="rule-gold h-px flex-1 opacity-40" />
        </div>
        <p className="mt-6 text-center font-serif text-xl italic text-[var(--text-dim)]">{sub}</p>
      </div>
      <SiteFooter />
      <MobileCta />
    </main>
  );
}
