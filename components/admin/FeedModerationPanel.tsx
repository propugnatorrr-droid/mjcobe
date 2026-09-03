'use client';

import { useActionState } from 'react';
import {
  approveFeedPost,
  hideFeedPost,
  rejectFeedPost,
  unpublishFeedPost,
} from '@/lib/feed/admin-actions';
import type { AdminState } from '@/lib/admin/actions';
import { admin } from '@/lib/copy/admin';

function ModerationForm({
  action,
  postId,
  children,
  buttonLabel,
  danger = false,
}: {
  action: (prev: AdminState, formData: FormData) => Promise<AdminState>;
  postId: string;
  children?: React.ReactNode;
  buttonLabel: string;
  danger?: boolean;
}) {
  const [, formAction] = useActionState<AdminState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 border-b border-[var(--line)] py-4">
      <input type="hidden" name="id" value={postId} />
      {children}
      <button
        type="submit"
        className="font-mono text-eyebrow uppercase transition-opacity [transition-duration:var(--duration-signature)] hover:opacity-70"
        style={{ color: danger ? 'var(--ember)' : 'var(--champagne)' }}
      >
        {buttonLabel}
      </button>
    </form>
  );
}

export function FeedModerationPanel({ postId, currentModeration }: { postId: string; currentModeration: string }) {
  return (
    <div className="max-w-2xl">
      {currentModeration !== 'approved' ? (
        <ModerationForm action={approveFeedPost} postId={postId} buttonLabel={admin.feed.approve}>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.feed.schedule}</span>
            <input
              type="datetime-local"
              name="scheduledFor"
              className="border-b border-[var(--line)] bg-transparent pb-1 font-mono text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
            />
          </label>
        </ModerationForm>
      ) : null}

      {currentModeration !== 'blocked' ? (
        <ModerationForm action={rejectFeedPost} postId={postId} buttonLabel={admin.feed.reject} danger>
          <label className="flex flex-1 flex-col gap-1">
            <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              {admin.feed.rejectionReason}
            </span>
            <input
              name="reason"
              className="w-full border-b border-[var(--line)] bg-transparent pb-1 font-mono text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
            />
          </label>
        </ModerationForm>
      ) : null}

      {currentModeration === 'approved' ? (
        <ModerationForm action={hideFeedPost} postId={postId} buttonLabel={admin.feed.hide} />
      ) : null}

      {currentModeration !== 'pending' ? (
        <ModerationForm action={unpublishFeedPost} postId={postId} buttonLabel={admin.feed.unpublish} />
      ) : null}
    </div>
  );
}
