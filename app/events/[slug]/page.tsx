import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileCta } from '@/components/MobileCta';
import { getPublicEvent, formatEventDateTime } from '@/lib/events/queries';
import { flagEnabled } from '@/lib/config/settings';
import { text } from '@/lib/copy/site-copy';
import { formatCents, cents } from '@/lib/money/cents';
import type { CopyKey } from '@/lib/copy/defaults';

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!(await flagEnabled('eventsEnabled'))) {
    return { title: await text('notfound.title') };
  }

  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) {
    return { title: await text('events.not_found') };
  }

  return { title: event.title, description: event.description ?? undefined };
}

export default async function EventDetailPage({ params }: Props) {
  if (!(await flagEnabled('eventsEnabled'))) {
    notFound();
  }

  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) {
    notFound();
  }

  const [backToEvents, venueLabel, ticketsHeading, ctaLabel, purchaseNotAvailable] = await Promise.all([
    text('events.back_to_events'),
    text('events.venue'),
    text('events.tickets_heading'),
    text(`events.cta.${event.ctaState}` as CopyKey),
    text('events.tickets_purchase_not_yet_available'),
  ]);

  const addressParts = [event.addressLine1, event.addressLine2, event.city, event.region, event.postalCode, event.country].filter(Boolean);

  return (
    <main id="main-content" className="surface-ink min-h-screen">
      <SiteNav sub={event.title} />

      <article className="site-shell section-space-compact">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 font-ui text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--champagne)]"
        >
          <ArrowUpRight aria-hidden size={14} className="rotate-180" />
          {backToEvents}
        </Link>

        {event.heroPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.heroPath}
            alt=""
            width={1200}
            height={675}
            className="mt-8 aspect-video w-full rounded-[var(--radius-panel)] object-cover"
            style={{ backgroundColor: 'var(--ink)' }}
          />
        ) : null}

        <p className="mt-8 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-[var(--champagne)]">
          {formatEventDateTime(event.startsAt, event.timezone)}
        </p>

        <h1 className="mt-4 font-display text-[clamp(2rem,6vw,4rem)] uppercase leading-none text-[var(--text)]">
          {event.title}
        </h1>

        {event.cancellationNote ? (
          <div className="mt-6 max-w-[52ch] border p-4" style={{ borderColor: 'var(--ember)', color: 'var(--ember)' }}>
            <p className="font-ui text-sm">{event.cancellationNote}</p>
          </div>
        ) : null}

        <div className="mt-6 max-w-[52ch]">
          <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
            {venueLabel}
          </p>
          <p className="mt-1 text-body text-[var(--text)]">{event.venueName}</p>
          {addressParts.length > 0 ? (
            <p className="mt-1 text-sm text-[var(--text-dim)]">{addressParts.join(', ')}</p>
          ) : null}
        </div>

        {event.description ? (
          <p className="mt-6 max-w-[52ch] text-body text-[var(--text-dim)]">{event.description}</p>
        ) : null}

        {event.ticketTypes.length > 0 ? (
          <section aria-labelledby="event-tickets-heading" className="mt-10 max-w-[52ch]">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="event-tickets-heading" className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                {ticketsHeading}
              </h2>
              <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--champagne)]">
                {ctaLabel}
              </span>
            </div>

            <ul className="mt-4 flex flex-col gap-3">
              {event.ticketTypes.map((tier) => (
                <li
                  key={tier.id}
                  className="flex items-baseline justify-between gap-4 border-b pb-3"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <div>
                    <p className="font-serif text-lg text-[var(--text)]">{tier.name}</p>
                    {tier.description ? (
                      <p className="mt-1 text-sm text-[var(--text-dim)]">{tier.description}</p>
                    ) : null}
                  </div>
                  <span className="whitespace-nowrap font-mono text-base tabular-nums text-[var(--text)]">
                    {formatCents(cents(tier.priceCents))}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-sm text-[var(--text-dim)]">{purchaseNotAvailable}</p>
          </section>
        ) : null}
      </article>

      <SiteFooter />
      <MobileCta />
    </main>
  );
}
