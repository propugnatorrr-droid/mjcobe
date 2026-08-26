'use client';

import { useActionState } from 'react';
import { saveSetting, type AdminState } from '@/lib/admin/actions';
import { admin } from '@/lib/copy/admin';

export function SettingRow({
  settingKey,
  value,
  description,
  isNew = false,
}: {
  settingKey: string;
  value: string;
  description: string | null;
  isNew?: boolean;
}) {
  const [state, action] = useActionState<AdminState, FormData>(saveSetting, {});

  return (
    <form action={action} className="border-b border-[var(--line)] py-5">
      <div className="flex flex-wrap items-center gap-4">
        {isNew ? (
          <input
            name="key"
            placeholder={admin.settings.newKey}
            className="w-56 border-b border-[var(--line)] bg-transparent pb-1 font-mono text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--text)] focus:outline-none"
          />
        ) : (
          <>
            <input type="hidden" name="key" value={settingKey} />
            <span className="w-56 shrink-0 font-mono text-sm text-[var(--text-dim)]">
              {settingKey}
            </span>
          </>
        )}

        <input
          name="value"
          defaultValue={value}
          placeholder={admin.settings.newValue}
          className="min-w-0 flex-1 border-b border-[var(--line)] bg-transparent pb-1 font-mono text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-[var(--text)] focus:outline-none"
        />

        <button
          type="submit"
          className="font-mono text-eyebrow uppercase text-[var(--text-dim)] transition-opacity [transition-duration:var(--duration-signature)] hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {isNew ? admin.actions.add : admin.actions.save}
        </button>
      </div>

      {description ? (
        <p className="mt-2 pl-0 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {description}
        </p>
      ) : null}

      {state.error === 'json' ? (
        <p className="mt-2 font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {admin.settings.invalidJson}
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
