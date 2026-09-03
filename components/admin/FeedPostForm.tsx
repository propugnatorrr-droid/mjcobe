'use client';

import { useActionState } from 'react';
import { createFeedPost, updateFeedPost } from '@/lib/feed/admin-actions';
import type { AdminState } from '@/lib/admin/actions';
import { AdminInput, AdminSelect } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

type FeedPostFormProps = {
  postId?: string;
  sponsors: { id: string; businessName: string }[];
  initial?: {
    sponsorId: string;
    postType: string;
    title: string | null;
    body: string | null;
    ctaLabel: string | null;
    ctaUrl: string | null;
    relatedSongId: string | null;
    relatedCampaignId: string | null;
    rightsAttested: boolean;
    mediaPath: string | null;
  };
};

export function FeedPostForm({ postId, sponsors, initial }: FeedPostFormProps) {
  const action = postId ? updateFeedPost : createFeedPost;
  const [state, formAction] = useActionState<AdminState, FormData>(action, {});

  return (
    <form action={formAction} encType="multipart/form-data" className="flex max-w-2xl flex-col gap-6">
      {postId ? <input type="hidden" name="id" value={postId} /> : null}

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {admin.feed.sponsorLabel}
        </span>
        <AdminSelect
          name="sponsorId"
          defaultValue={initial?.sponsorId}
          options={sponsors.map((sp) => ({ value: sp.id, label: sp.businessName }))}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.feed.postType}</span>
        <AdminSelect
          name="postType"
          defaultValue={initial?.postType ?? 'text'}
          options={[
            { value: 'text', label: 'Text' },
            { value: 'image', label: 'Image' },
            { value: 'link', label: 'Link' },
          ]}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.feed.titleField}</span>
        <AdminInput name="title" defaultValue={initial?.title ?? ''} wide />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.feed.body}</span>
        <textarea
          name="body"
          defaultValue={initial?.body ?? ''}
          rows={6}
          className="w-full border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.feed.ctaLabel}</span>
        <AdminInput name="ctaLabel" defaultValue={initial?.ctaLabel ?? ''} wide />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.feed.ctaUrl}</span>
        <AdminInput name="ctaUrl" defaultValue={initial?.ctaUrl ?? ''} wide />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.feed.media}</span>
        {initial?.mediaPath ? (
          <p className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">
            {admin.feed.mediaCurrent}: {initial.mediaPath}
          </p>
        ) : null}
        <input
          type="file"
          name="media"
          accept="image/png,image/webp,image/jpeg"
          className="w-full border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
        />
        <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.feed.mediaHint}</span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.feed.relatedSong}</span>
        <AdminInput name="relatedSongId" defaultValue={initial?.relatedSongId ?? ''} wide />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.feed.relatedCampaign}</span>
        <AdminInput name="relatedCampaignId" defaultValue={initial?.relatedCampaignId ?? ''} wide />
      </label>

      <label className="flex items-center gap-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
        <input
          type="checkbox"
          name="rightsAttested"
          defaultChecked={initial?.rightsAttested ?? false}
          className="h-4 w-4 accent-[var(--champagne)]"
        />
        {admin.feed.rightsAttested}
      </label>

      <button
        type="submit"
        className="mj-button mj-button--primary w-fit"
      >
        {admin.actions.save}
      </button>

      {state.error === 'unsafe_url' ? (
        <p className="font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {admin.feed.unsafeUrl}
        </p>
      ) : null}
      {state.error === 'media_type' ? (
        <p className="font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {admin.feed.mediaTypeError}
        </p>
      ) : null}
      {state.error === 'media_size' ? (
        <p className="font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {admin.feed.mediaSizeError}
        </p>
      ) : null}
      {state.error === 'media_signature' ? (
        <p className="font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {admin.feed.mediaSignatureError}
        </p>
      ) : null}
      {state.error && !['unsafe_url', 'media_type', 'media_size', 'media_signature'].includes(state.error) ? (
        <p className="font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {admin.failed}
        </p>
      ) : null}
      {state.ok ? (
        <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.saved}</p>
      ) : null}
    </form>
  );
}
