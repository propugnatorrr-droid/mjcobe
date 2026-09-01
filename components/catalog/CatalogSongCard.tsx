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
        'music-v2-card group',
        featured ? 'music-v2-card-featured' : '',
      ].join(' ')}
    >
      <Link
        href={href}
        aria-label={song.title}
        className="music-v2-card-art-link"
      >
        {song.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={song.coverPath}
            alt=""
            width={900}
            height={900}
            loading="lazy"
            className="music-v2-card-art"
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
            className="music-v2-card-art-placeholder"
          >
            <Headphones
              size={34}
              strokeWidth={1.25}
            />
          </span>
        )}

        <span
          aria-hidden
          className="music-v2-card-art-treatment"
        />

        <span className="music-v2-card-status">
          <StatusBadge
            status={song.status}
            label={labels.status}
          />
        </span>

        <span
          aria-hidden
          className="music-v2-card-arrow"
        >
          <ArrowUpRight
            size={18}
            strokeWidth={1.8}
          />
        </span>

        {showCampaign ? (
          <span className="music-v2-card-supporters">
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

      <div className="music-v2-card-content">
        <div>
          <h2 className="music-v2-card-title">
            <Link href={href}>
              {song.title}
            </Link>
          </h2>

          {song.description ? (
            <p className="music-v2-card-description">
              {song.description}
            </p>
          ) : null}
        </div>

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
          className="music-v2-card-link"
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
