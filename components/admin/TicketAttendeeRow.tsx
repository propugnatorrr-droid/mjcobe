'use client';

import { useActionState } from 'react';
import { voidTicketAction, reissueTicketAction } from '@/lib/tickets/admin-actions';
import type { AdminState } from '@/lib/admin/actions';
import { Td, StateDot } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';
import type { AdminTicketRow } from '@/lib/tickets/queries';

function VoidForm({ ticketId, eventId }: { ticketId: string; eventId: string }) {
  const [state, formAction] = useActionState<AdminState, FormData>(voidTicketAction, {});
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="eventId" value={eventId} />
      <input
        name="reason"
        placeholder={admin.attendees.reason}
        required
        className="w-28 border-b border-[var(--line)] bg-transparent pb-1 font-mono text-xs text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
      />
      <button type="submit" className="font-mono text-[0.625rem] uppercase hover:opacity-70" style={{ color: 'var(--ember)' }}>
        {admin.attendees.void}
      </button>
      {state.ok ? <span className="font-mono text-[0.5625rem] text-[var(--text-dim)]">{admin.saved}</span> : null}
    </form>
  );
}

function ReissueForm({ ticketId, eventId }: { ticketId: string; eventId: string }) {
  const [state, formAction] = useActionState<AdminState, FormData>(reissueTicketAction, {});
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="eventId" value={eventId} />
      <input
        name="reason"
        placeholder={admin.attendees.reason}
        required
        className="w-28 border-b border-[var(--line)] bg-transparent pb-1 font-mono text-xs text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
      />
      <button type="submit" className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)] hover:opacity-70">
        {admin.attendees.reissue}
      </button>
      {state.ok ? <span className="font-mono text-[0.5625rem] text-[var(--text-dim)]">{admin.saved}</span> : null}
    </form>
  );
}

export function TicketAttendeeRow({ ticket, eventId }: { ticket: AdminTicketRow; eventId: string }) {
  return (
    <tr>
      <Td>
        <StateDot state={ticket.status} />
      </Td>
      <Td mono>{ticket.displayCode}</Td>
      <Td dim mono nowrap>{ticket.issuedAt.toLocaleDateString()}</Td>
      <Td dim mono nowrap>{ticket.checkedInAt ? ticket.checkedInAt.toLocaleString() : '—'}</Td>
      <Td>
        <div className="flex flex-col items-start gap-2">
          {ticket.status !== 'void' ? (
            <>
              <VoidForm ticketId={ticket.id} eventId={eventId} />
              <ReissueForm ticketId={ticket.id} eventId={eventId} />
            </>
          ) : (
            <span className="font-mono text-[0.625rem] text-[var(--text-dim)]">{ticket.voidReason}</span>
          )}
        </div>
      </Td>
    </tr>
  );
}
