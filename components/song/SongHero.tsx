import { Disc3 } from 'lucide-react';
import { AudioPreview } from '@/components/song/AudioPreview';
import { StatusBadge } from '@/components/primitives/StatusBadge';
import { text } from '@/lib/copy/site-copy';
import type { CopyKey } from '@/lib/copy/defaults';
import type { SongPageData } from '@/lib/song/queries';

const STATUS_COPY: Record<string, CopyKey> = {
  released: 'music.released',
  coming_soon: 'music.coming_soon',
  building: 'music.building_now',
  vault: 'music.vault',
  draft: 'music.vault',
};

export async function SongHero({
  song,
  campaign,
  cover,
  audio,
}: Pick<
  SongPageData,
  'song' | 'campaign' | 'cover' | 'audio'
>) {
   const [
    comingSoonLabel,
    artistName,
    statusLabel,
    previewLabel,
    artworkAlt,
    playLabel,
    pauseLabel,
    seekLabel,
  ] = await Promise.all([
    text('song.preview_coming_soon'),
    text('hero.artist_name'),
    text(
      STATUS_COPY[song.status] ??
        'music.vault',
    ),
    text('song.preview_window'),
    text('song.cover_alt', {
      song: song.title,
    }),
    text('song.audio.play', {
      song: song.title,
    }),
    text('song.audio.pause', {
      song: song.title,
    }),
    text('song.audio.seek', {
      song: song.title,
    }),
  ]);


  const artwork =
    cover?.path ?? '/media/song-hero-mobile.webp';

  return (
    <header
      aria-labelledby="song-title"
      className="song-v2-hero"
    >
      <div
        aria-hidden
        className="song-v2-hero-backdrop"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artwork}
          alt=""
          width={1600}
          height={1600}
          fetchPriority="high"
          className="song-v2-hero-backdrop-image"
        />

        <div className="song-v2-hero-backdrop-treatment" />
      </div>

      <div className="site-shell song-v2-hero-shell">
        <div className="song-v2-art-column">
          <div className="song-v2-art-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
                       <img
              src={artwork}
              alt={artworkAlt}
              width={1200}
              height={1200}
              fetchPriority="high"
              className="song-v2-art-image"
            />

            <div
              aria-hidden
              className="song-v2-art-vignette"
            />

            <span className="song-v2-art-index">
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="song-v2-hero-copy">
          <div className="song-v2-hero-status">
            <StatusBadge
              status={song.status}
              label={statusLabel}
            />

            <span
              aria-hidden
              className="song-v2-hero-rule"
            />

            <span>{artistName}</span>
          </div>

          <h1
            id="song-title"
            className="song-v2-title"
          >
            {song.title}
          </h1>



          <div className="song-v2-player">
            <div className="song-v2-player-heading">
              <span className="song-v2-player-icon">
                <Disc3
                  aria-hidden
                  size={18}
                  strokeWidth={1.6}
                />
              </span>

              <div className="min-w-0">
                <p>{song.title}</p>
                <span>{previewLabel}</span>
              </div>
            </div>

            <AudioPreview
              src={audio?.path ?? null}
              songId={song.id}
              campaignId={
                campaign?.id ??
                null
              }
              previewStartMs={
                song.previewStartMs
              }
              previewEndMs={
                song.previewEndMs
              }
              allowFullPlayback={
                song.allowFullPlayback
              }
              comingSoonLabel={
                comingSoonLabel
              }
              playLabel={playLabel}
              pauseLabel={pauseLabel}
              seekLabel={seekLabel}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
