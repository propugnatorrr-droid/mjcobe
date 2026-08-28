import type {
  AdminJourneyEvent,
  JourneyAdminOption,
} from '@/lib/admin/journey';
import {
  setJourneyEventVisibility,
} from '@/lib/admin/journey-actions';
import { admin } from '@/lib/copy/admin';
import { JourneyEventForm } from './JourneyEventForm';

type Props = {
  event: AdminJourneyEvent;
  songs: JourneyAdminOption[];
  campaigns: JourneyAdminOption[];
  images: JourneyAdminOption[];
};

function eventDate(date: Date): string {
  return new Intl.DateTimeFormat(
    'en-US',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    },
  ).format(date);
}

export function JourneyEventCard({
  event,
  songs,
  campaigns,
  images,
}: Props) {
  return (
    <article
      className="overflow-hidden rounded-[var(--radius-panel)] border"
      style={{
        borderColor: 'var(--line)',
        background: 'var(--ink-2)',
      }}
    >
      <div className="grid gap-6 p-6 lg:grid-cols-[10rem_1fr_auto]">
        {event.imagePath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imagePath}
            alt=""
            width={320}
            height={180}
            className="aspect-video w-full rounded-[var(--radius-panel)] object-cover lg:aspect-square"
          />
        ) : (
          <div
            className="flex aspect-video items-center justify-center rounded-[var(--radius-panel)] border font-mono text-eyebrow uppercase text-[var(--text-faint)] lg:aspect-square"
            style={{
              borderColor: 'var(--line)',
            }}
          >
            {admin.journey.noImage}
          </div>
        )}

        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-eyebrow uppercase text-[var(--champagne)]">
              {admin.journey.kinds[event.kind]}
            </span>

            <span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              {event.isVisible
                ? admin.journey.public
                : admin.journey.hidden}
            </span>

            {event.isAuto ? (
              <span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                {admin.journey.automatic}
              </span>
            ) : null}
          </div>

          <h2 className="mt-4 font-display text-2xl uppercase text-[var(--text)]">
            {event.title}
          </h2>

          <p className="mt-2 font-mono text-xs text-[var(--text-dim)]">
            {eventDate(event.occurredAt)}
          </p>

          <p className="mt-2 text-body text-[var(--text-dim)]">
            {event.songTitle ??
              admin.journey.globalEvent}
            {event.campaignName
              ? ` — ${event.campaignName}`
              : ''}
          </p>

          {event.body ? (
            <p className="mt-4 max-w-[70ch] text-body text-[var(--text-dim)]">
              {event.body}
            </p>
          ) : null}
        </div>

        <form
          action={setJourneyEventVisibility}
          className="flex items-start"
        >
          <input
            type="hidden"
            name="eventId"
            value={event.id}
          />
          <input
            type="hidden"
            name="action"
            value={
              event.isVisible
                ? 'hide'
                : 'show'
            }
          />

          <button
            type="submit"
            className="rounded-full border border-[var(--line)] px-4 py-2 font-mono text-eyebrow uppercase text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--champagne)] hover:text-[var(--text)]"
          >
            {event.isVisible
              ? admin.actions.hide
              : admin.actions.unhide}
          </button>
        </form>
      </div>

      <details className="border-t border-[var(--line)]">
        <summary className="cursor-pointer px-6 py-4 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {admin.journey.edit}
        </summary>

        <div className="border-t border-[var(--line)] p-6">
          <JourneyEventForm
            event={event}
            songs={songs}
            campaigns={campaigns}
            images={images}
          />
        </div>
      </details>
    </article>
  );
}
