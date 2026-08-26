'use client';

import { useActionState } from 'react';
import { addBlocklistEntry, type AdminState } from '@/lib/admin/actions';
import { admin } from '@/lib/copy/admin';
import { AdminInput, AdminSelect } from './ui';

const KIND_OPTIONS = Object.entries(admin.blocklist.kinds).map(([value, label]) => ({ value, label }));

export function BlocklistForm() {
  const [state, action] = useActionState<AdminState, FormData>(addBlocklistEntry, {});

  return (
    <form action={action} className="flex flex-wrap items-end gap-6 border-b py-6" style={{ borderColor: 'var(--line)' }}>
      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.blocklist.kind}</span>
        <AdminSelect name="kind" options={KIND_OPTIONS} defaultValue="email" />
      </label>
      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.blocklist.value}</span>
        <AdminInput name="value" wide />
      </label>
      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.blocklist.note}</span>
        <AdminInput name="note" wide />
      </label>
      <button
        type="submit"
        className="rounded-full bg-[var(--champagne)] px-5 py-2.5 font-ui text-xs font-medium uppercase tracking-[0.04em] text-[var(--ink)] transition-colors [transition-duration:var(--duration-signature)] hover:brightness-110"
      >
        {admin.blocklist.add}
      </button>
      {state.error ? (
        <span className="font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {admin.failed}
        </span>
      ) : null}
    </form>
  );
}
