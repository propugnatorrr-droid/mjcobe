'use client';

import { useActionState } from 'react';
import { createTicketType, updateTicketType, deleteTicketType } from '@/lib/events/admin-actions';
import type { AdminState } from '@/lib/admin/actions';
import { AdminInput } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';
import type { AdminTicketType } from '@/lib/events/queries';

function centsToDollarsString(cents: number): string {
  return (cents / 100).toFixed(2);
}

function TicketTypeRow({ ticketType }: { ticketType: AdminTicketType }) {
  const [updateState, updateAction] = useActionState<AdminState, FormData>(updateTicketType, {});
  const [, deleteAction] = useActionState<AdminState, FormData>(deleteTicketType, {});

  return (
    <div className="flex flex-col gap-4 border-b py-6" style={{ borderColor: 'var(--line)' }}>
      <form action={updateAction} className="flex flex-wrap items-end gap-4">
        <input type="hidden" name="id" value={ticketType.id} />

        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.ticketTypes.name}</span>
          <AdminInput name="name" defaultValue={ticketType.name} wide />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.ticketTypes.price}</span>
          <AdminInput name="price" defaultValue={centsToDollarsString(ticketType.priceCents)} />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.ticketTypes.capacity}</span>
          <AdminInput name="capacity" defaultValue={String(ticketType.capacity)} />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.ticketTypes.perOrderLimit}</span>
          <AdminInput name="perOrderLimit" defaultValue={String(ticketType.perOrderLimit)} />
        </label>

        <label className="flex items-center gap-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          <input type="checkbox" name="isActive" defaultChecked={ticketType.isActive} className="h-4 w-4 accent-[var(--champagne)]" />
          {admin.events.ticketTypes.active}
        </label>

        <label className="flex w-full flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.ticketTypes.description}</span>
          <AdminInput name="description" defaultValue={ticketType.description ?? ''} wide />
        </label>

        <button type="submit" className="font-mono text-eyebrow uppercase text-[var(--champagne)] transition-opacity hover:opacity-70">
          {admin.actions.save}
        </button>

        {updateState.ok ? <span className="font-mono text-[0.625rem] text-[var(--text-dim)]">{admin.saved}</span> : null}
      </form>

      <form action={deleteAction}>
        <input type="hidden" name="id" value={ticketType.id} />
        <button type="submit" className="font-mono text-eyebrow uppercase transition-opacity hover:opacity-70" style={{ color: 'var(--ember)' }}>
          {admin.actions.delete}
        </button>
      </form>
    </div>
  );
}

function AddTicketTypeForm({ eventId }: { eventId: string }) {
  const [state, formAction] = useActionState<AdminState, FormData>(createTicketType, {});

  return (
    <form action={formAction} className="mt-6 flex flex-wrap items-end gap-4">
      <input type="hidden" name="eventId" value={eventId} />

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.ticketTypes.name}</span>
        <AdminInput name="name" wide />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.ticketTypes.price}</span>
        <AdminInput name="price" placeholder="0.00" />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.ticketTypes.capacity}</span>
        <AdminInput name="capacity" placeholder="100" />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.ticketTypes.perOrderLimit}</span>
        <AdminInput name="perOrderLimit" placeholder="8" />
      </label>

      <label className="flex w-full flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.ticketTypes.description}</span>
        <AdminInput name="description" wide />
      </label>

      <button type="submit" className="mj-button mj-button--primary w-fit">
        {admin.events.ticketTypes.add}
      </button>

      {state.ok ? <span className="font-mono text-[0.625rem] text-[var(--text-dim)]">{admin.saved}</span> : null}
      {state.error ? (
        <span className="font-mono text-[0.625rem]" style={{ color: 'var(--ember)' }}>
          {admin.failed}
        </span>
      ) : null}
    </form>
  );
}

export function TicketTypeManager({ eventId, ticketTypes }: { eventId: string; ticketTypes: AdminTicketType[] }) {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.ticketTypes.heading}</p>
      <p className="mt-2 max-w-[52ch] text-sm text-[var(--text-dim)]">{admin.events.ticketTypes.hint}</p>

      {ticketTypes.length === 0 ? (
        <p className="mt-6 font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.ticketTypes.empty}</p>
      ) : (
        <div className="mt-6">
          {ticketTypes.map((ticketType) => (
            <TicketTypeRow key={ticketType.id} ticketType={ticketType} />
          ))}
        </div>
      )}

      <AddTicketTypeForm eventId={eventId} />
    </div>
  );
}
