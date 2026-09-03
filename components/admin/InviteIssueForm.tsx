'use client';

import { useActionState } from 'react';
import { issueSubmissionInvite } from '@/lib/feed/invite-actions';
import type { AdminState } from '@/lib/admin/actions';
import { AdminInput, AdminSelect } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export function InviteIssueForm({ sponsors }: { sponsors: { id: string; businessName: string }[] }) {
  const [state, formAction] = useActionState<AdminState, FormData>(issueSubmissionInvite, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-6 border-b pb-8" style={{ borderColor: 'var(--line)' }}>
      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.feed.invites.sponsorLabel}</span>
        <AdminSelect name="sponsorId" options={sponsors.map((sp) => ({ value: sp.id, label: sp.businessName }))} />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.feed.invites.recipientEmail}</span>
        <AdminInput name="recipientEmail" type="email" wide />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.feed.invites.expiresIn}</span>
        <AdminInput name="expiresInDays" type="number" defaultValue="14" />
      </label>

      <button type="submit" className="mj-button mj-button--primary w-fit">
        {admin.feed.invites.issue}
      </button>

      {state.error === 'sponsor_not_approved' ? (
        <p className="w-full font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {admin.feed.invites.sponsorMustBeApproved}
        </p>
      ) : null}
      {state.error && state.error !== 'sponsor_not_approved' ? (
        <p className="w-full font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {admin.failed}
        </p>
      ) : null}
      {state.ok ? (
        <p className="w-full font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.saved}</p>
      ) : null}
    </form>
  );
}
