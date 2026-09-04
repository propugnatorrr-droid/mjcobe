'use client';

import { useActionState } from 'react';
import { issueOrderRefund } from '@/lib/commerce/admin-actions';
import type { AdminState } from '@/lib/admin/actions';
import { AdminInput } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export function OrderRefundForm({ orderId, paymentId }: { orderId: string; paymentId: string }) {
  const [state, formAction] = useActionState<AdminState, FormData>(issueOrderRefund, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-4">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="paymentId" value={paymentId} />

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.orders.refundAmount}</span>
        <AdminInput name="amount" placeholder="0.00" />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.orders.refundReason}</span>
        <AdminInput name="reason" wide />
      </label>

      <button type="submit" className="font-mono text-eyebrow uppercase transition-opacity hover:opacity-70" style={{ color: 'var(--ember)' }}>
        {admin.orders.issueRefund}
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
