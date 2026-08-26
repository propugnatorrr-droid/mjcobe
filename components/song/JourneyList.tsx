import { Eyebrow } from '@/components/primitives/Eyebrow';
import { text } from '@/lib/copy/site-copy';
import type { CopyKey } from '@/lib/copy/defaults';
import { formatDay } from '@/lib/song/queries';
import type { SongPageData } from '@/lib/song/queries';

export async function JourneyList({ journey }: { journey: SongPageData['journey'] }) {
  return (
    <section className="py-16 md:py-24">
      <Eyebrow>{await text('song.section.journey')}</Eyebrow>

      {journey.length === 0 ? (
        <p className="mt-8 max-w-[62ch] text-body text-[var(--text-dim)]">
          {await text('song.empty.journey')}
        </p>
      ) : (
        <ol className="mt-10 border-t border-[var(--line)]">
          {await Promise.all(
            journey.map(async (event) => (
              <li
                key={event.id}
                className="grid grid-cols-1 gap-3 border-b border-[var(--line)] py-8 md:grid-cols-[10rem_8rem_1fr] md:gap-12"
              >
                <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                  {await formatDay(event.occurredAt)}
                </span>
                <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                  {await text(`journey.kind.${event.kind}` as CopyKey)}
                </span>
                <div className="min-w-0">
                  <p className="text-body text-[var(--text)]">{event.title}</p>
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
  );
}
