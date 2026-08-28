import {
  createJourneyEvent,
  updateJourneyEvent,
} from '@/lib/admin/journey-actions';
import type {
  AdminJourneyEvent,
  JourneyAdminOption,
} from '@/lib/admin/journey';
import {
  JOURNEY_EVENT_KINDS,
} from '@/lib/journey/kinds';
import { admin } from '@/lib/copy/admin';
import { CheckField } from '@/components/primitives/Field';

type Props = {
  event?: AdminJourneyEvent;
  songs: JourneyAdminOption[];
  campaigns: JourneyAdminOption[];
  images: JourneyAdminOption[];
};

const fieldClass = [
  'min-h-11 w-full',
  'rounded-[var(--radius-panel)]',
  'border border-[var(--line)]',
  'bg-[var(--field-bg)] px-3 py-2',
  'font-mono text-sm',
  'text-[var(--text)]',
  'focus:border-[var(--champagne)]',
  'focus:outline-none',
].join(' ');

function localDateValue(
  date: Date,
): string {
  return date
    .toISOString()
    .slice(0, 16);
}

function Label({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
      {children}
    </span>
  );
}

export function JourneyEventForm({
  event,
  songs,
  campaigns,
  images,
}: Props) {
  const action = event
    ? updateJourneyEvent
    : createJourneyEvent;

  const occurredAt =
    event?.occurredAt ?? new Date();

  return (
    <form
      action={action}
      className="flex flex-col gap-6"
    >
      {event ? (
        <input
          type="hidden"
          name="eventId"
          value={event.id}
        />
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <Label>{admin.journey.title}</Label>
          <input
            name="title"
            required
            maxLength={200}
            defaultValue={event?.title ?? ''}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <Label>{admin.journey.kind}</Label>
          <select
            name="kind"
            required
            defaultValue={
              event?.kind ?? 'manual'
            }
            className={fieldClass}
          >
            {JOURNEY_EVENT_KINDS.map(
              (kind) => (
                <option
                  key={kind}
                  value={kind}
                >
                  {admin.journey.kinds[kind]}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <Label>{admin.journey.song}</Label>
          <select
            name="songId"
            defaultValue={
              event?.songId ?? ''
            }
            className={fieldClass}
          >
            <option value="">
              {admin.journey.noSong}
            </option>
            {songs.map((song) => (
              <option
                key={song.value}
                value={song.value}
              >
                {song.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <Label>
            {admin.journey.campaign}
          </Label>
          <select
            name="campaignId"
            defaultValue={
              event?.campaignId ?? ''
            }
            className={fieldClass}
          >
            <option value="">
              {admin.journey.noCampaign}
            </option>
            {campaigns.map((campaign) => (
              <option
                key={campaign.value}
                value={campaign.value}
              >
                {campaign.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <Label>
            {admin.journey.occurredAt}
          </Label>
          <input
            name="occurredAt"
            type="datetime-local"
            required
            defaultValue={localDateValue(
              occurredAt,
            )}
            className={fieldClass}
          />
          <span className="font-mono text-[0.625rem] text-[var(--text-faint)]">
            {admin.journey.timeHint}
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <Label>{admin.journey.image}</Label>
          <select
            name="mediaAssetId"
            defaultValue={
              event?.mediaAssetId ?? ''
            }
            className={fieldClass}
          >
            <option value="">
              {admin.journey.noImage}
            </option>
            {images.map((image) => (
              <option
                key={image.value}
                value={image.value}
              >
                {image.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <Label>{admin.journey.body}</Label>
        <textarea
          name="body"
          rows={4}
          maxLength={2000}
          defaultValue={event?.body ?? ''}
          className={fieldClass}
        />
      </label>

      <div className="flex flex-wrap items-center gap-5">
        <CheckField
          name="isVisible"
          label={admin.journey.visible}
          defaultChecked={
            event?.isVisible ?? true
          }
        />

        <button
          type="submit"
          className="rounded-full bg-[var(--champagne)] px-6 py-3 font-ui text-xs font-medium uppercase tracking-[0.05em] text-[var(--ink)] transition-[filter] [transition-duration:var(--duration-signature)] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {event
            ? admin.journey.save
            : admin.journey.create}
        </button>
      </div>
    </form>
  );
}
