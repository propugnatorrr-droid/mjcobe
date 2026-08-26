'use client';

import { useActionState, useState } from 'react';
import { issueRefund, type AdminState } from '@/lib/admin/actions';
import { admin } from '@/lib/copy/admin';

const REASONS = Object.entries(admin.refund.reasons) as [string, string][];

/**
 * Collapsed by default. A refund is irreversible, so it should never be one
 * stray click away in a dense table.
 */
export function RefundForm({
  transactionId,
  maxLabel,
}: {
  transactionId: string;
  maxLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<AdminState, FormData>(issueRefund, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-eyebrow uppercase transition-opacity [transition-duration:var(--duration-signature)] hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        style={{ color: 'var(--ember)' }}
      >
        {admin.actions.refund}
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 border-l border-[var(--line-strong)] pl-4">
      <input type="hidden" name="transactionId" value={transactionId} />

      <input
        name="amount"
        inputMode="decimal"
        placeholder={maxLabel}
        className="w-28 border-b border-[var(--line)] bg-transparent pb-1 font-mono text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--text)] focus:outline-none"
      />

      <select
        name="reason"
        className="border-b border-[var(--line)] bg-[var(--ink)] pb-1 font-mono text-sm text-[var(--text)] focus:outline-none"
      >
        {REASONS.map(([value, label]) => (
          <option key={value} value={value} className="bg-[var(--ink)]">
            {label}
          </option>
        ))}
      </select>

      <div className="flex gap-4">
        <button
          type="submit"
          className="font-mono text-eyebrow uppercase"
          style={{ color: 'var(--ember)' }}
        >
          {admin.actions.refund}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-mono text-eyebrow uppercase text-[var(--text-dim)]"
        >
          ×
        </button>
      </div>

      {state.error ? (
        <span className="font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {admin.failed}
        </span>
      ) : null}
      {state.ok ? (
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {admin.saved}
        </span>
      ) : null}
    </form>
  );
}
