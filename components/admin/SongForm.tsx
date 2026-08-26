'use client';

import { useActionState } from 'react';
import { createSong, updateSong, type AdminState } from '@/lib/admin/actions';
import { admin } from '@/lib/copy/admin';
import { Field, CheckField } from '@/components/primitives/Field';
import { AdminSelect } from './ui';
import type { AdminSongRow } from '@/lib/admin/songs';

const STATUS_OPTIONS = Object.entries(admin.songs.statuses).map(([value, label]) => ({ value, label }));

export function SongForm({ song }: { song?: AdminSongRow }) {
  const action = song ? updateSong : createSong;
  const [state, formAction] = useActionState<AdminState, FormData>(action, {});

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-10">
      {song ? <input type="hidden" name="id" value={song.id} /> : null}

      <Field label={admin.songs.title} name="title" defaultValue={song?.title} required />
      <Field
        label={admin.songs.slug}
        name="slug"
        defaultValue={song?.slug}
        placeholder={admin.songs.slug}
      />

      <label className="flex flex-col gap-3">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {admin.songs.status}
        </span>
        <AdminSelect name="status" options={STATUS_OPTIONS} defaultValue={song?.status ?? 'draft'} />
      </label>

      <label className="flex flex-col gap-3">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {admin.songs.description}
        </span>
        <textarea
          name="description"
          defaultValue={song?.description ?? ''}
          rows={4}
          className="w-full border-b border-[var(--line)] bg-transparent pb-3 text-body text-[var(--text)] transition-colors [transition-duration:var(--duration-signature)] focus:border-[var(--text)] focus:outline-none"
        />
      </label>

      <Field label={admin.songs.spotifyUrl} name="spotifyUrl" type="url" defaultValue={song?.spotifyUrl ?? ''} />
      <Field label={admin.songs.appleMusicUrl} name="appleMusicUrl" type="url" defaultValue={song?.appleMusicUrl ?? ''} />
      <Field label={admin.songs.youtubeUrl} name="youtubeUrl" type="url" defaultValue={song?.youtubeUrl ?? ''} />
      <Field label={admin.songs.musicVideoUrl} name="musicVideoUrl" type="url" defaultValue={song?.musicVideoUrl ?? ''} />

      <CheckField label={admin.songs.published} name="isPublished" defaultChecked={song?.isPublished ?? false} />

      <div className="flex items-center gap-6">
        <button
          type="submit"
          className="rounded-full bg-[var(--champagne)] px-6 py-3 font-ui text-sm font-medium uppercase tracking-[0.04em] text-[var(--ink)] transition-colors [transition-duration:var(--duration-signature)] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {song ? admin.songs.save : admin.songs.create}
        </button>
        {state.ok ? (
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.saved}</span>
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
