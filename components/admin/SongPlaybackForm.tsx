'use client';

import { useActionState } from 'react';
import {
  updateSongPlayback,
  type SongMediaState,
} from '@/lib/admin/song-media-actions';
import type {
  AdminSongRow,
} from '@/lib/admin/songs';
import {
  CheckField,
} from '@/components/primitives/Field';
import { admin } from '@/lib/copy/admin';

const fieldClass = [
  'min-h-11 w-full',
  'rounded-[var(--radius-panel)]',
  'border border-[var(--line)]',
  'bg-[var(--field-bg)] px-3 py-2',
  'font-mono text-sm',
  'text-[var(--text)]',
  'focus:border-[var(--champagne)]',
  'focus:outline-none',
].join(' ');

export function SongPlaybackForm({
  song,
}: {
  song: AdminSongRow;
}) {
  const [state, formAction] =
    useActionState<
      SongMediaState,
      FormData
    >(
      updateSongPlayback,
      {},
    );

  return (
    <form
      action={formAction}
      className="mt-6 flex flex-col gap-5 rounded-[var(--radius-panel)] border border-[var(--line)] p-5"
    >
      <input
        type="hidden"
        name="songId"
        value={song.id}
      />

      <h3 className="font-mono text-eyebrow uppercase text-[var(--text)]">
        {admin.songs.playbackSettings}
      </h3>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {admin.songs.previewStart}
          </span>
          <input
            name="previewStartSeconds"
            type="number"
            min={0}
            step={0.1}
            required
            defaultValue={
              song.previewStartMs / 1000
            }
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {admin.songs.previewEnd}
          </span>
          <input
            name="previewEndSeconds"
            type="number"
            min={0.1}
            step={0.1}
            required
            defaultValue={
              song.previewEndMs / 1000
            }
            className={fieldClass}
          />
        </label>
      </div>

      <CheckField
        name="allowFullPlayback"
        label={admin.songs.fullPlayback}
        defaultChecked={
          song.allowFullPlayback
        }
      />

      <div className="flex items-center gap-5">
        <button
          type="submit"
          className="rounded-full bg-[var(--champagne)] px-5 py-2.5 font-ui text-xs font-medium uppercase tracking-[0.04em] text-[var(--ink)]"
        >
          {admin.songs.savePlayback}
        </button>

        {state.ok ? (
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {admin.saved}
          </span>
        ) : null}

        {state.error ? (
          <span
            className="font-mono text-eyebrow uppercase"
            style={{
              color: 'var(--ember)',
            }}
          >
            {state.error ===
            'preview_too_long'
              ? admin.songs
                  .previewTooLong
              : admin.failed}
          </span>
        ) : null}
      </div>
    </form>
  );
}
