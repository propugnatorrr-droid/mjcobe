'use client';

import { useActionState } from 'react';
import { createReferralLink, type AdminState } from '@/lib/admin/actions';
import { admin } from '@/lib/copy/admin';
import { AdminInput, AdminSelect } from './ui';

export function ReferralLinkForm({
  campaigns,
}: {
  campaigns: { value: string; label: string }[];
}) {
  const [state, action] = useActionState<AdminState, FormData>(createReferralLink, {});

  return (
    <form action={action} className="flex flex-wrap items-end gap-6 border-b py-6" style={{ borderColor: 'var(--line)' }}>
      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.referrals.code}</span>
        <AdminInput name="code" placeholder="ABC" />
      </label>
      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.referrals.campaign}</span>
        <AdminSelect name="campaignId" options={campaigns} />
      </label>
      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.referrals.label}</span>
        <AdminInput name="label" wide />
      </label>
      <button
        type="submit"
        className="rounded-full bg-[var(--champagne)] px-5 py-2.5 font-ui text-xs font-medium uppercase tracking-[0.04em] text-[var(--ink)] transition-colors [transition-duration:var(--duration-signature)] hover:brightness-110"
      >
        {admin.referrals.create}
      </button>
      {state.error === 'duplicate' ? (
        <span className="font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {admin.referrals.duplicate}
        </span>
      ) : state.error ? (
        <span className="font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {admin.failed}
        </span>
      ) : null}
    </form>
  );
}
