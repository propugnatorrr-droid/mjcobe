import {
  ArrowDown,
  Disc3,
} from 'lucide-react';
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
  cover: _cover,
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
  ] = await Promise.all([
    text('song.preview_coming_soon'),
    text('hero.artist_name'),
    text(
      STATUS_COPY[song.status] ??
        'music.vault',
    ),
    text('song.preview_window'),
  ]);

  return (
    <header
      aria-labelledby="song-title"
      className="song-v2-hero"
    >
      <picture className="song-v2-hero-media">
        <source
          media="(min-width: 768px)"
          srcSet="/media/song-hero-desktop.webp"
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/song-hero-mobile.webp"
          alt=""
          width={1200}
          height={1500}
          fetchPriority="high"
          className="song-v2-hero-image"
        />
      </picture>

      <div
        aria-hidden
        className="song-v2-hero-treatment"
      />

      <div className="site-shell song-v2-hero-shell">
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

          {campaign?.objective ? (
            <p className="song-v2-objective">
              {campaign.objective}
            </p>
          ) : song.description ? (
            <p className="song-v2-objective">
              {song.description}
            </p>
          ) : null}

          <div className="song-v2-player">
            <div className="song-v2-player-heading">
              <span className="song-v2-player-icon">
                <Disc3
                  aria-hidden
                  size={18}
                  strokeWidth={1.6}
                />
              </span>

              <div>
                <p>{song.title}</p>
                <span>{previewLabel}</span>
              </div>
            </div>

            <AudioPreview
              src={audio?.path ?? null}
              previewStartMs={song.previewStartMs}
              previewEndMs={song.previewEndMs}
              allowFullPlayback={song.allowFullPlayback}
              comingSoonLabel={comingSoonLabel}
            />
          </div>
        </div>

        <a
          href="#campaign"
          className="song-v2-scroll"
          aria-label="Continue to campaign details"
        >
          <span>EXPLORE</span>

          <ArrowDown
            aria-hidden
            size={16}
            strokeWidth={1.7}
          />
        </a>
      </div>
    </header>
  );
}
