import { notFound } from 'next/navigation';
import { getAdminEvent } from '@/lib/events/queries';
import { listTicketsForEvent } from '@/lib/tickets/queries';
import { TicketAttendeeRow } from '@/components/admin/TicketAttendeeRow';
import { AdminHeading, AdminHint, Table } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function EventAttendeesPage({ params }: Props) {
  const { id } = await params;
  const result = await getAdminEvent(id);
  if (!result) {
    notFound();
  }

  const tickets = await listTicketsForEvent(id);

  return (
    <>
      <AdminHeading>
        {admin.attendees.heading} — {result.event.title}
      </AdminHeading>
      <AdminHint>{admin.attendees.hint}</AdminHint>

      {tickets.length === 0 ? (
        <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.attendees.empty}</p>
      ) : (
        <Table head={[admin.attendees.status, admin.attendees.code, admin.attendees.issued, admin.attendees.checkedInAt, '']}>
          {tickets.map((ticket) => (
            <TicketAttendeeRow key={ticket.id} ticket={ticket} eventId={id} />
          ))}
        </Table>
      )}
    </>
  );
}
