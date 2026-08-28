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
import {
  MediaLibraryPicker,
} from './MediaLibraryPicker';

export function SongMediaManager({
  song,
  cover,
  audio,
  mediaLibrary,
}: {
  song: AdminSongRow;
  cover:
    AdminMediaAssetRow | null;
  audio:
    AdminMediaAssetRow | null;
  mediaLibrary:
    AdminMediaAssetRow[];
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
        <div>
          <SongMediaUpload
            songId={song.id}
            kind="cover"
            asset={cover}
          />

          <MediaLibraryPicker
            songId={song.id}
            assignment="cover"
            assets={
              mediaLibrary
            }
            currentAssetId={
              song.coverAssetId
            }
          />
        </div>

        <div>
          <SongMediaUpload
            songId={song.id}
            kind="audio"
            asset={audio}
          />

          <MediaLibraryPicker
            songId={song.id}
            assignment="audio"
            assets={
              mediaLibrary
            }
            currentAssetId={
              song.audioAssetId
            }
          />
        </div>
      </div>

      <SongPlaybackForm
        song={song}
      />
    </section>
  );
}
