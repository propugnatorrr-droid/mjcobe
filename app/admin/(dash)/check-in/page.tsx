import { listAdminEvents } from '@/lib/events/queries';
import { CheckInForm } from '@/components/admin/CheckInForm';
import { AdminHeading, AdminHint } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

export default async function AdminCheckInPage() {
  const events = await listAdminEvents();

  return (
    <>
      <AdminHeading>{admin.checkIn.heading}</AdminHeading>
      <AdminHint>{admin.checkIn.hint}</AdminHint>
      <CheckInForm events={events.map((e) => ({ id: e.id, title: e.title }))} />
    </>
  );
}
