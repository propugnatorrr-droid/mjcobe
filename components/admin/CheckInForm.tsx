'use client';

import { useActionState, useEffect, useRef } from 'react';
import { checkInTicketAction, type CheckInState } from '@/lib/tickets/admin-actions';
import { reverseCheckInAction } from '@/lib/tickets/admin-actions';
import type { AdminState } from '@/lib/admin/actions';
import { AdminSelect } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

const RESULT_LABELS: Record<string, string> = {
  success: admin.checkIn.resultSuccess,
  already_checked_in: admin.checkIn.resultAlreadyCheckedIn,
  void: admin.checkIn.resultVoid,
  wrong_event: admin.checkIn.resultWrongEvent,
  invalid: admin.checkIn.resultInvalid,
};

const RESULT_COLOR: Record<string, string> = {
  success: 'var(--champagne)',
  already_checked_in: 'var(--ember)',
  void: 'var(--ember)',
  wrong_event: 'var(--ember)',
  invalid: 'var(--ember)',
};

function ReverseForm({ ticketId }: { ticketId: string }) {
  const [state, formAction] = useActionState<AdminState, FormData>(reverseCheckInAction, {});

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      <input
        name="reason"
        placeholder={admin.checkIn.reversalReason}
        required
        className="w-48 border-b border-[var(--line)] bg-transparent pb-1 font-mono text-xs text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
      />
      <button type="submit" className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)] hover:opacity-70">
        {admin.checkIn.reverseCheckIn}
      </button>
      {state.ok ? <span className="font-mono text-[0.625rem] text-[var(--text-dim)]">{admin.saved}</span> : null}
    </form>
  );
}

export function CheckInForm({ events }: { events: { id: string; title: string }[] }) {
  const [state, formAction] = useActionState<CheckInState, FormData>(checkInTicketAction, {});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.outcome && inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  }, [state]);

  return (
    <div className="max-w-xl">
      <form action={formAction} className="flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.checkIn.selectEvent}</span>
          <AdminSelect name="eventId" options={events.map((e) => ({ value: e.id, label: e.title }))} />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.checkIn.codeLabel}</span>
          <input
            ref={inputRef}
            name="code"
            autoFocus
            autoComplete="off"
            className="w-full border border-[var(--line)] bg-transparent p-4 font-mono text-lg text-[var(--text)] focus:border-[var(--champagne)] focus:outline-none"
          />
        </label>

        <button type="submit" className="mj-button mj-button--primary w-fit">
          {admin.checkIn.submit}
        </button>
      </form>

      {state.outcome ? (
        <div className="mt-6 border p-4" style={{ borderColor: RESULT_COLOR[state.outcome] }}>
          <p className="font-mono text-lg uppercase" style={{ color: RESULT_COLOR[state.outcome] }}>
            {RESULT_LABELS[state.outcome] ?? state.outcome}
          </p>
          {state.attendeeLabel ? <p className="mt-1 text-sm text-[var(--text-dim)]">{state.attendeeLabel}</p> : null}
          {state.checkedInAt ? (
            <p className="mt-1 font-mono text-xs text-[var(--text-dim)]">{new Date(state.checkedInAt).toLocaleString()}</p>
          ) : null}

          {state.outcome === 'already_checked_in' && state.ticketId ? <ReverseForm ticketId={state.ticketId} /> : null}
        </div>
      ) : null}
    </div>
  );
}
