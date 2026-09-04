'use client';

import { useActionState } from 'react';
import { createEvent, updateEvent } from '@/lib/events/admin-actions';
import type { AdminState } from '@/lib/admin/actions';
import { AdminInput, AdminSelect } from '@/components/admin/ui';
import { Field, CheckField } from '@/components/primitives/Field';
import { admin } from '@/lib/copy/admin';
import type { AdminEvent } from '@/lib/events/queries';

const STATUS_OPTIONS = Object.entries(admin.events.statuses).map(([value, label]) => ({ value, label }));

/** datetime-local inputs need "YYYY-MM-DDTHH:mm" in the browser's own
 * local time — Date#toISOString is UTC, so it's sliced and offset-adjusted
 * rather than used directly (which would silently shift the displayed
 * time by the visitor's/admin's UTC offset every time the form re-renders). */
function toDatetimeLocalValue(value: Date | null): string {
  if (!value) return '';
  const offsetMs = value.getTimezoneOffset() * 60 * 1000;
  return new Date(value.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function EventForm({ event }: { event?: AdminEvent }) {
  const action = event ? updateEvent : createEvent;
  const [state, formAction] = useActionState<AdminState, FormData>(action, {});

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}

      <Field label={admin.events.title} name="title" defaultValue={event?.title} required />
      <Field label={admin.events.slug} name="slug" defaultValue={event?.slug} placeholder={admin.events.slug} />

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.description}</span>
        <textarea
          name="description"
          defaultValue={event?.description ?? ''}
          rows={4}
          className="w-full border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
        />
      </label>

      <Field label={admin.events.venueName} name="venueName" defaultValue={event?.venueName} required />
      <Field label={admin.events.addressLine1} name="addressLine1" defaultValue={event?.addressLine1 ?? ''} />
      <Field label={admin.events.addressLine2} name="addressLine2" defaultValue={event?.addressLine2 ?? ''} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label={admin.events.city} name="city" defaultValue={event?.city ?? ''} />
        <Field label={admin.events.region} name="region" defaultValue={event?.region ?? ''} />
        <Field label={admin.events.postalCode} name="postalCode" defaultValue={event?.postalCode ?? ''} />
      </div>
      <Field label={admin.events.country} name="country" defaultValue={event?.country ?? ''} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.startsAt}</span>
          <input
            type="datetime-local"
            name="startsAt"
            required
            defaultValue={toDatetimeLocalValue(event?.startsAt ?? null)}
            className="border-b border-[var(--line)] bg-transparent pb-2 font-mono text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.endsAt}</span>
          <input
            type="datetime-local"
            name="endsAt"
            defaultValue={toDatetimeLocalValue(event?.endsAt ?? null)}
            className="border-b border-[var(--line)] bg-transparent pb-2 font-mono text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
          />
        </label>
      </div>

      <Field
        label={admin.events.timezone}
        name="timezone"
        defaultValue={event?.timezone ?? 'America/New_York'}
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.salesStartAt}</span>
          <input
            type="datetime-local"
            name="salesStartAt"
            defaultValue={toDatetimeLocalValue(event?.salesStartAt ?? null)}
            className="border-b border-[var(--line)] bg-transparent pb-2 font-mono text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.salesEndAt}</span>
          <input
            type="datetime-local"
            name="salesEndAt"
            defaultValue={toDatetimeLocalValue(event?.salesEndAt ?? null)}
            className="border-b border-[var(--line)] bg-transparent pb-2 font-mono text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.status}</span>
        <AdminSelect name="status" options={STATUS_OPTIONS} defaultValue={event?.status ?? 'scheduled'} />
      </label>

      <Field
        label={admin.events.capacity}
        name="capacity"
        defaultValue={event?.capacity != null ? String(event.capacity) : ''}
      />

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.events.cancellationNote}</span>
        <AdminInput name="cancellationNote" defaultValue={event?.cancellationNote ?? ''} wide />
      </label>

      <CheckField label={admin.events.ticketingEnabled} name="ticketingEnabled" defaultChecked={event?.ticketingEnabled ?? false} />
      <CheckField label={admin.events.isPublished} name="isPublished" defaultChecked={event?.isPublished ?? false} />

      <button type="submit" className="mj-button mj-button--primary w-fit">
        {admin.actions.save}
      </button>

      {state.ok ? (
        <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.saved}</p>
      ) : null}
      {state.error ? (
        <p className="font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {admin.failed}
        </p>
      ) : null}
    </form>
  );
}
