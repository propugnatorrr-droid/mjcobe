'use client';

import { useActionState } from 'react';
import { resendTicketEmailAction } from '@/lib/tickets/admin-actions';
import type { AdminState } from '@/lib/admin/actions';
import { admin } from '@/lib/copy/admin';

export function ResendTicketsForm({ orderId }: { orderId: string }) {
  const [state, formAction] = useActionState<AdminState, FormData>(resendTicketEmailAction, {});

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <button type="submit" className="font-mono text-eyebrow uppercase text-[var(--champagne)] transition-opacity hover:opacity-70">
        {admin.orders.resendTickets}
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
