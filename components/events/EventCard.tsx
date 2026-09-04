import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { PublicEvent } from '@/lib/events/queries';

export function EventCard({
  event,
  dateTime,
  ctaLabel,
  viewEventLabel,
}: {
  event: PublicEvent;
  dateTime: string;
  ctaLabel: string;
  viewEventLabel: string;
}) {
  const href = `/events/${event.slug}`;

  return (
    <article className="panel panel-interactive flex flex-col overflow-hidden">
      <Link href={href} aria-label={event.title} className="block">
        {event.heroPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.heroPath}
            alt=""
            width={800}
            height={600}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
            style={{
              backgroundColor: 'var(--ink)',
              backgroundImage: event.heroPlaceholder ? `url("${event.heroPlaceholder}")` : undefined,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[var(--champagne)]">
          {dateTime}
        </span>

        <h2 className="font-serif text-xl leading-tight text-[var(--text)]">
          <Link href={href}>{event.title}</Link>
        </h2>

        <p className="text-sm leading-6 text-[var(--text-dim)]">{event.venueName}</p>

        <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
          {ctaLabel}
        </span>

        <Link
          href={href}
          className="mt-auto inline-flex w-fit items-center gap-2 pt-2 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--champagne)]"
        >
          {viewEventLabel}
          <ArrowUpRight aria-hidden size={13} />
        </Link>
      </div>
    </article>
  );
}
