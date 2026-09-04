'use client';

import { useActionState } from 'react';
import { issueOrderCredentialRegeneration } from '@/lib/commerce/admin-actions';
import type { AdminState } from '@/lib/admin/actions';
import { admin } from '@/lib/copy/admin';

export function RegenerateOrderLinkForm({ orderId }: { orderId: string }) {
  const [state, formAction] = useActionState<AdminState, FormData>(issueOrderCredentialRegeneration, {});

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-4">
      <input type="hidden" name="orderId" value={orderId} />
      <button type="submit" className="font-mono text-eyebrow uppercase text-[var(--text-dim)] transition-opacity hover:opacity-70">
        {admin.orders.regenerateLink}
      </button>
      {state.ok ? <span className="font-mono text-[0.625rem] text-[var(--text-dim)]">{admin.saved}</span> : null}
    </form>
  );
}
