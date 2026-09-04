import Link from 'next/link';
import { listAdminEvents } from '@/lib/events/queries';
import { AdminHeading, AdminHint, StateDot, Table, Td } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
  const events = await listAdminEvents();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <AdminHeading>{admin.events.heading}</AdminHeading>
          <AdminHint>{admin.events.hint}</AdminHint>
        </div>

        <Link
          href="/admin/events/new"
          className="font-mono text-eyebrow uppercase text-[var(--champagne)] transition-opacity [transition-duration:var(--duration-signature)] hover:opacity-70"
        >
          + {admin.events.create}
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.empty}</p>
      ) : (
        <Table head={[admin.events.status, admin.events.title, admin.events.venue, admin.events.startsAt, admin.events.published]}>
          {events.map((event) => (
            <tr key={event.id}>
              <Td>
                <Link href={`/admin/events/${event.id}`} className="hover:text-[var(--champagne)]">
                  <StateDot state={event.status} />
                </Link>
              </Td>
              <Td>
                <Link href={`/admin/events/${event.id}`} className="hover:text-[var(--champagne)]">
                  {event.title}
                </Link>
              </Td>
              <Td dim>{event.venueName}</Td>
              <Td dim mono nowrap>{event.startsAt.toLocaleDateString()}</Td>
              <Td dim>{event.isPublished ? 'Yes' : 'No'}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
