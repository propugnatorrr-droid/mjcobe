import Link from 'next/link';
import { SiteNav } from '@/components/SiteNav';
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

  const visible = filter === 'all' ? entries : entries.filter((e) => journeyGroup(e.kind) === filter);

  return (
    <main className="surface-ink min-h-screen">
      <SiteNav />

      <section className="mx-auto max-w-3xl px-6 py-16 md:px-12 md:py-24">
        <h1 className="font-display text-display text-[var(--text)]">{title}</h1>
        <p className="mt-4 text-body text-[var(--text-dim)]">{sub}</p>

        <div className="mt-10 flex flex-wrap gap-3">
          {FILTERS.map((f, i) => (
            <Link
              key={f}
              href={f === 'all' ? '/journey' : `/journey?filter=${f}`}
              className="rounded-full border px-4 py-1.5 font-mono text-eyebrow uppercase transition-colors [transition-duration:var(--duration-signature)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
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
          <p className="mt-16 text-body text-[var(--text-dim)]">{empty}</p>
        ) : (
          <ol className="relative mt-14 border-l pl-10" style={{ borderColor: 'var(--line)' }}>
            {await Promise.all(
              visible.map(async (event) => {
                const Icon = journeyIcon(event.kind);
                return (
                  <li key={event.id} className="relative pb-10 last:pb-0">
                    <span
                      aria-hidden
                      className="absolute -left-[45px] top-1 flex h-8 w-8 items-center justify-center rounded-full border"
                      style={{ borderColor: 'var(--champagne)', background: 'var(--ink)' }}
                    >
                      <Icon size={14} color="var(--champagne)" />
                    </span>

                    <div
                      className="rounded-[var(--radius-panel)] border p-5"
                      style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
                    >
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <span className="font-mono text-eyebrow uppercase text-[var(--champagne)]">
                          {await formatDay(event.occurredAt)}
                        </span>
                        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                          {await text(`journey.kind.${event.kind}` as CopyKey)}
                        </span>
                      </div>

                      <p className="mt-2 text-body text-[var(--text)]">
                        {event.songSlug ? (
                          <Link href={`/song/${event.songSlug}`} className="hover:text-[var(--champagne)]">
                            {event.title}
                          </Link>
                        ) : (
                          event.title
                        )}
                      </p>

                      {event.body ? (
                        <p className="mt-2 max-w-[62ch] text-body text-[var(--text-dim)]">
                          {event.body}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              }),
            )}
          </ol>
        )}
      </section>
    </main>
  );
}
