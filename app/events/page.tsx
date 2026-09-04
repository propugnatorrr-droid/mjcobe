import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileCta } from '@/components/MobileCta';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { EventCard } from '@/components/events/EventCard';
import { listUpcomingEvents, listPastEvents, formatEventDateTime } from '@/lib/events/queries';
import { flagEnabled } from '@/lib/config/settings';
import { text } from '@/lib/copy/site-copy';
import type { CopyKey } from '@/lib/copy/defaults';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  if (!(await flagEnabled('eventsEnabled'))) {
    return { title: await text('notfound.title') };
  }
  return { title: await text('events.title') };
}

export default async function EventsPage() {
  if (!(await flagEnabled('eventsEnabled'))) {
    notFound();
  }

  const [upcoming, past, eyebrow, title, intro, empty, upcomingHeading, pastHeading, viewEvent] = await Promise.all([
    listUpcomingEvents(),
    listPastEvents(),
    text('events.eyebrow'),
    text('events.title'),
    text('events.intro'),
    text('events.empty'),
    text('events.upcoming_heading'),
    text('events.past_heading'),
    text('events.view_event'),
  ]);

  const ctaLabels = await Promise.all(
    [...upcoming, ...past].map((event) => text(`events.cta.${event.ctaState}` as CopyKey)),
  );
  const ctaLabelByEventId = new Map(upcoming.concat(past).map((event, i) => [event.id, ctaLabels[i]]));

  return (
    <main id="main-content" className="surface-ink min-h-screen">
      <SiteNav sub={title} />

      <header className="site-shell section-space-compact">
        <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-[var(--champagne)]">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5rem)] uppercase leading-none text-[var(--text)]">
          {title}
        </h1>
        <p className="mt-4 max-w-[52ch] text-body text-[var(--text-dim)]">{intro}</p>
      </header>

      <section aria-labelledby="events-upcoming-heading" className="site-shell section-space-compact pt-0">
        <div id="events-upcoming-heading">
          <SectionHeading>{upcomingHeading}</SectionHeading>
        </div>

        {upcoming.length === 0 ? (
          <div className="panel mt-8 p-8 sm:p-10">
            <p className="max-w-[52ch] text-base leading-7 text-[var(--text-dim)]">{empty}</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                dateTime={formatEventDateTime(event.startsAt, event.timezone)}
                ctaLabel={ctaLabelByEventId.get(event.id) ?? ''}
                viewEventLabel={viewEvent}
              />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 ? (
        <section aria-labelledby="events-past-heading" className="site-shell section-space-compact pt-0">
          <div id="events-past-heading">
            <SectionHeading>{pastHeading}</SectionHeading>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                dateTime={formatEventDateTime(event.startsAt, event.timezone)}
                ctaLabel={ctaLabelByEventId.get(event.id) ?? ''}
                viewEventLabel={viewEvent}
              />
            ))}
          </div>
        </section>
      ) : null}

      <SiteFooter />
      <MobileCta />
    </main>
  );
}
