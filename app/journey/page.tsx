import Link from 'next/link';
import { SiteNav } from '@/components/SiteNav';
import { formatDay } from '@/lib/song/queries';
import { getGlobalJourney, journeyGroup, type JourneyFilter } from '@/lib/journey/queries';
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

      <section className="mx-auto max-w-4xl px-6 py-16 md:px-12 md:py-24">
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
          <ol className="mt-10 border-t" style={{ borderColor: 'var(--line)' }}>
            {await Promise.all(
              visible.map(async (event) => (
                <li
                  key={event.id}
                  className="grid grid-cols-1 gap-3 border-b py-8 md:grid-cols-[10rem_8rem_1fr] md:gap-8"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                    {await formatDay(event.occurredAt)}
                  </span>
                  <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                    {await text(`journey.kind.${event.kind}` as CopyKey)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-body text-[var(--text)]">
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
                      <p className="mt-2 max-w-[62ch] text-body text-[var(--text-dim)]">
                        {event.body}
                      </p>
                    ) : null}
                  </div>
                </li>
              )),
            )}
          </ol>
        )}
      </section>
    </main>
  );
}
