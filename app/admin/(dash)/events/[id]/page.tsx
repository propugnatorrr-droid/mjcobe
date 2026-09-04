import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminEvent } from '@/lib/events/queries';
import { EventForm } from '@/components/admin/EventForm';
import { TicketTypeManager } from '@/components/admin/TicketTypeManager';
import { AdminHeading, AdminHint, StateDot } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function AdminEventPage({ params }: Props) {
  const { id } = await params;
  const result = await getAdminEvent(id);

  if (!result) {
    notFound();
  }

  const { event, ticketTypes } = result;

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <AdminHeading>{event.title}</AdminHeading>
        <StateDot state={event.status} />
        <Link
          href={`/admin/events/${event.id}/attendees`}
          className="font-mono text-eyebrow uppercase text-[var(--champagne)] transition-opacity hover:opacity-70"
        >
          {admin.attendees.heading}
        </Link>
      </div>
      <AdminHint>{admin.events.hint}</AdminHint>

      <div className="max-w-2xl">
        <EventForm event={event} />
      </div>

      <div className="mt-14">
        <TicketTypeManager eventId={event.id} ticketTypes={ticketTypes} />
      </div>
    </>
  );
}
