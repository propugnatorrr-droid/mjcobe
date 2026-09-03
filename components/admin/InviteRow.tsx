'use client';

import { useActionState } from 'react';
import { revokeSubmissionInvite, resendSubmissionInvite } from '@/lib/feed/invite-actions';
import type { AdminState } from '@/lib/admin/actions';
import { Td, InlineAction } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';
import type { AdminSubmissionInvite, InviteStatus } from '@/lib/feed/queries';

function statusLabel(status: InviteStatus): string {
  switch (status) {
    case 'used':
      return admin.feed.invites.statusUsed;
    case 'revoked':
      return admin.feed.invites.statusRevoked;
    case 'expired':
      return admin.feed.invites.statusExpired;
    default:
      return admin.feed.invites.statusPending;
  }
}

function RevokeForm({ inviteId }: { inviteId: string }) {
  const [, formAction] = useActionState<AdminState, FormData>(revokeSubmissionInvite, {});
  return (
    <form action={formAction}>
      <input type="hidden" name="inviteId" value={inviteId} />
      <InlineAction danger>{admin.feed.invites.revoke}</InlineAction>
    </form>
  );
}

function ResendForm({ inviteId }: { inviteId: string }) {
  const [state, formAction] = useActionState<AdminState, FormData>(resendSubmissionInvite, {});
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="inviteId" value={inviteId} />
      <input
        name="recipientEmail"
        type="email"
        required
        placeholder="email"
        className="w-36 border-b border-[var(--line)] bg-transparent pb-1 font-mono text-xs text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
      />
      <InlineAction>{admin.feed.invites.resend}</InlineAction>
      {state.ok ? <span className="font-mono text-[0.625rem] text-[var(--text-dim)]">{admin.saved}</span> : null}
    </form>
  );
}

export function InviteRow({ invite }: { invite: AdminSubmissionInvite }) {
  return (
    <tr>
      <Td dim>{invite.sponsorName}</Td>
      <Td mono dim>{statusLabel(invite.status)}</Td>
      <Td dim mono nowrap>{invite.createdAt.toLocaleDateString()}</Td>
      <Td dim mono nowrap>{invite.expiresAt.toLocaleDateString()}</Td>
      <Td>
        <div className="flex flex-col items-start gap-3">
          {invite.usable ? <RevokeForm inviteId={invite.id} /> : null}
          {!invite.usedAt ? <ResendForm inviteId={invite.id} /> : null}
        </div>
      </Td>
    </tr>
  );
}
