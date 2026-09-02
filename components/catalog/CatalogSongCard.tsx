import Link from 'next/link';
import {
  ArrowUpRight,
  Headphones,
  Users,
} from 'lucide-react';
import { CatalogCampaignStats } from '@/components/catalog/CatalogCampaignStats';
import { StatusBadge } from '@/components/primitives/StatusBadge';
import { AudioPreview } from '@/components/song/AudioPreview';
import { StreamingLinks } from '@/components/song/StreamingLinks';
import type { CatalogSong } from '@/lib/catalog/queries';

export type CatalogCardLabels = {
  status: string;
  supporters: string;
  joinJourney: string;
  previewComingSoon: string;
  playPreview: string;
  pausePreview: string;
  seekPreview: string;
};


type CatalogSongCardProps = {
  song: CatalogSong;
  labels: CatalogCardLabels;
  featured?: boolean;
};

/**
 * Below 640px, non-featured cards switch to a compact landscape layout
 * (cover left, title/status beside it, player/funding/CTA in a full-width
 * row underneath) instead of the desktop stack squeezed into one column —
 * see .music-card's mobile rule in app/styles/music.css. That's why the
 * art link and the title/description block are separate elements
 * (`.music-card-heading`) rather than one `.music-card-content` wrapper:
 * the audio player and funding/CTA block (`.music-card-body`) need to be
 * a sibling that can span full width on its own grid row.
 */
export function CatalogSongCard({
  song,
  labels,
  featured = false,
}: CatalogSongCardProps) {
  const href = `/song/${song.slug}`;

  const showCampaign =
    song.goalCents > 0 &&
    song.status !== 'released';

  return (
    <article
      className={[
        'music-card group',
        featured ? 'music-card-featured' : '',
      ].join(' ')}
    >
      <Link
        href={href}
        aria-label={song.title}
        className="music-card-art-link"
      >
        {song.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={song.coverPath}
            alt=""
            width={900}
            height={900}
            loading="lazy"
            className="music-card-art"
            style={{
              backgroundColor: 'var(--ink)',
              backgroundImage: song.coverPlaceholder
                ? `url("${song.coverPlaceholder}")`
                : undefined,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
        ) : (
          <span
            aria-hidden
            className="music-card-art-placeholder"
          >
            <Headphones
              size={34}
              strokeWidth={1.25}
            />
          </span>
        )}

        <span
          aria-hidden
          className="music-card-art-treatment"
        />

        <span className="music-card-status">
          <StatusBadge
            status={song.status}
            label={labels.status}
          />
        </span>

        <span
          aria-hidden
          className="music-card-arrow"
        >
          <ArrowUpRight
            size={18}
            strokeWidth={1.8}
          />
        </span>

        {showCampaign ? (
          <span className="music-card-supporters">
            <Users
              aria-hidden
              size={13}
              strokeWidth={1.8}
            />

            <span className="numeric">
              {song.supporterCount.toLocaleString()}
            </span>

            <span>{labels.supporters}</span>
          </span>
        ) : null}
      </Link>

      <div className="music-card-heading">
        <h2 className="music-card-title">
          <Link href={href}>
            {song.title}
          </Link>
        </h2>

        {song.description ? (
          <p className="music-card-description">
            {song.description}
          </p>
        ) : null}
      </div>

      <div className="music-card-body">
        <AudioPreview
          src={song.audioPath}
          songId={song.id}
          campaignId={
            song.campaignId
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
            labels.previewComingSoon
          }
          playLabel={
            labels.playPreview
          }
          pauseLabel={
            labels.pausePreview
          }
          seekLabel={
            labels.seekPreview
          }
        />


        {showCampaign ? (
          <CatalogCampaignStats
            song={song}
            supportersLabel={labels.supporters}
          />
        ) : (
          <StreamingLinks
            spotifyUrl={song.spotifyUrl}
            appleMusicUrl={song.appleMusicUrl}
            youtubeUrl={song.youtubeUrl}
          />
        )}

        <Link
          href={href}
          className="music-card-link"
        >
          <span>{labels.joinJourney}</span>

          <ArrowUpRight
            aria-hidden
            size={15}
            strokeWidth={1.8}
          />
        </Link>
      </div>
    </article>
  );
}
