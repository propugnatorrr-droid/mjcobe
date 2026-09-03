'use client';

import { useActionState } from 'react';
import { saveFeatureFlag } from '@/lib/admin/flag-actions';
import type { AdminState } from '@/lib/admin/actions';
import { admin } from '@/lib/copy/admin';

export function FlagRow({
  flagKey,
  enabled,
  description,
  isNew = false,
}: {
  flagKey: string;
  enabled: boolean;
  description: string | null;
  isNew?: boolean;
}) {
  const [state, action] = useActionState<AdminState, FormData>(saveFeatureFlag, {});

  return (
    <form action={action} className="border-b border-[var(--line)] py-5">
      <div className="flex flex-wrap items-center gap-4">
        {isNew ? (
          <input
            name="key"
            placeholder={admin.flags.newKey}
            className="w-56 border-b border-[var(--line)] bg-transparent pb-1 font-mono text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--text)] focus:outline-none"
          />
        ) : (
          <>
            <input type="hidden" name="key" value={flagKey} />
            <span className="w-56 shrink-0 font-mono text-sm text-[var(--text-dim)]">
              {flagKey}
            </span>
          </>
        )}

        <input
          name="description"
          defaultValue={description ?? ''}
          placeholder={admin.flags.description}
          className="min-w-0 flex-1 border-b border-[var(--line)] bg-transparent pb-1 font-mono text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--text)] focus:outline-none"
        />

        <label className="flex shrink-0 items-center gap-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={enabled}
            className="h-4 w-4 accent-[var(--champagne)]"
          />
          {admin.flags.enabled}
        </label>

        <button
          type="submit"
          className="font-mono text-eyebrow uppercase text-[var(--text-dim)] transition-opacity [transition-duration:var(--duration-signature)] hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {isNew ? admin.flags.add : admin.actions.save}
        </button>
      </div>

      {state.error === 'missing' ? (
        <p className="mt-2 font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {admin.failed}
        </p>
      ) : null}
      {state.ok ? (
        <p className="mt-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {admin.saved}
        </p>
      ) : null}
    </form>
  );
}
