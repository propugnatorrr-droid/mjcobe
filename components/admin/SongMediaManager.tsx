import type {
  AdminMediaAssetRow,
  AdminSongRow,
} from '@/lib/admin/songs';
import { admin } from '@/lib/copy/admin';
import {
  SongMediaUpload,
} from './SongMediaUpload';
import {
  SongPlaybackForm,
} from './SongPlaybackForm';

export function SongMediaManager({
  song,
  cover,
  audio,
}: {
  song: AdminSongRow;
  cover: AdminMediaAssetRow | null;
  audio: AdminMediaAssetRow | null;
}) {
  return (
    <section className="mt-16">
      <h2 className="font-mono text-eyebrow uppercase tracking-[0.14em] text-[var(--text)]">
        {admin.songs.media}
      </h2>

      <p className="mt-3 mb-6 max-w-[62ch] text-body text-[var(--text-dim)]">
        {admin.songs.mediaHint}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <SongMediaUpload
          songId={song.id}
          kind="cover"
          asset={cover}
        />

        <SongMediaUpload
          songId={song.id}
          kind="audio"
          asset={audio}
        />
      </div>

      <SongPlaybackForm song={song} />
    </section>
  );
}
