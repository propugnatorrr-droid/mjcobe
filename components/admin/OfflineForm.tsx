'use client';

import { useActionState, useState } from 'react';
import { addOfflineContribution, type AdminState } from '@/lib/admin/actions';
import { admin } from '@/lib/copy/admin';
import { Field, CheckField } from '@/components/primitives/Field';
import { AdminSelect } from './ui';

const METHODS = Object.entries(admin.offline.methods).map(([value, label]) => ({ value, label }));

export function OfflineForm({ campaigns }: { campaigns: { value: string; label: string }[] }) {
  const [state, action] = useActionState<AdminState, FormData>(addOfflineContribution, {});
  const [supportType, setSupportType] = useState<'fan' | 'business'>('business');

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-10">
      <label className="flex flex-col gap-3">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {admin.offline.campaign}
        </span>
        <AdminSelect name="campaignId" options={campaigns} />
      </label>

      <label className="flex flex-col gap-3">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {admin.offline.supportType}
        </span>
        <select
          name="supportType"
          value={supportType}
          onChange={(e) => setSupportType(e.target.value as 'fan' | 'business')}
          className="border-b border-[var(--line)] bg-[var(--ink)] pb-1 font-mono text-sm text-[var(--text)] focus:outline-none"
        >
          <option value="business" className="bg-[var(--ink)]">business</option>
          <option value="fan" className="bg-[var(--ink)]">fan</option>
        </select>
      </label>

      {supportType === 'business' ? (
        <Field label={admin.offline.businessName} name="businessName" required />
      ) : (
        <Field label={admin.offline.displayName} name="displayName" />
      )}

      <Field label={admin.offline.contactEmail} name="email" type="email" inputMode="email" />
      <Field label={admin.offline.amount} name="amount" inputMode="decimal" required />

      <label className="flex flex-col gap-3">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {admin.offline.method}
        </span>
        <AdminSelect name="method" options={METHODS} defaultValue="wire" />
      </label>

      <CheckField
        label={admin.offline.leaderboardEligible}
        name="leaderboardEligible"
        defaultChecked
      />

      <div className="flex items-center gap-6">
        <button
          type="submit"
          className="rounded-full bg-[var(--champagne)] px-6 py-3 font-ui text-sm font-medium uppercase tracking-[0.04em] text-[var(--ink)] transition-colors [transition-duration:var(--duration-signature)] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {admin.offline.submit}
        </button>
        {state.ok ? (
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {admin.offline.recorded}
          </span>
        ) : null}
        {state.error ? (
          <span className="font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
            {admin.failed}
          </span>
        ) : null}
      </div>
    </form>
  );
}
