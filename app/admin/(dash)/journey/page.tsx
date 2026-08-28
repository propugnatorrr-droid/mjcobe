import {
  AdminHeading,
  AdminHint,
} from '@/components/admin/ui';
import {
  JourneyEventForm,
} from '@/components/admin/JourneyEventForm';
import {
  JourneyEventCard,
} from '@/components/admin/JourneyEventCard';
import {
  getJourneyAdminData,
} from '@/lib/admin/journey';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

export default async function AdminJourneyPage() {
  const {
    events,
    songs,
    campaigns,
    images,
  } = await getJourneyAdminData();

  return (
    <>
      <AdminHeading>
        {admin.journey.heading}
      </AdminHeading>
      <AdminHint>
        {admin.journey.hint}
      </AdminHint>

      <section
        className="rounded-[var(--radius-panel)] border p-6"
        style={{
          borderColor: 'var(--line)',
          background: 'var(--ink-2)',
        }}
      >
        <h2 className="mb-6 font-mono text-eyebrow uppercase tracking-[0.14em] text-[var(--text)]">
          {admin.journey.createHeading}
        </h2>

        <JourneyEventForm
          songs={songs}
          campaigns={campaigns}
          images={images}
        />
      </section>

      <section className="mt-12">
        <h2 className="mb-6 font-mono text-eyebrow uppercase tracking-[0.14em] text-[var(--text)]">
          {admin.journey.eventsHeading}
        </h2>

        {events.length === 0 ? (
          <p className="text-body text-[var(--text-dim)]">
            {admin.journey.empty}
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {events.map((event) => (
              <JourneyEventCard
                key={event.id}
                event={event}
                songs={songs}
                campaigns={campaigns}
                images={images}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
