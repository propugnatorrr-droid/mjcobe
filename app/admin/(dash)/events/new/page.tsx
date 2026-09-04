import { AdminHeading, AdminHint } from '@/components/admin/ui';
import { EventForm } from '@/components/admin/EventForm';
import { admin } from '@/lib/copy/admin';

export default function NewEventPage() {
  return (
    <>
      <AdminHeading>{admin.events.createHeading}</AdminHeading>
      <AdminHint>{admin.events.hint}</AdminHint>
      <EventForm />
    </>
  );
}
