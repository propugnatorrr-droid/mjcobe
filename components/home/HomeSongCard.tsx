import Link from 'next/link';
import {
  ArrowUpRight,
  Headphones,
  Users,
} from 'lucide-react';
import { FundingMeter } from '@/components/primitives/FundingMeter';
import { StatusBadge } from '@/components/primitives/StatusBadge';
import type { CatalogSong } from '@/lib/catalog/queries';
import { cents, formatCents } from '@/lib/money/cents';

export type HomeSongCardLabels = {
  status: string;
  supporters: string;
  viewProject: string;
};

type HomeSongCardProps = {
  song: CatalogSong;
  labels: HomeSongCardLabels;
};

export function HomeSongCard({
  song,
  labels,
}: HomeSongCardProps) {
  const href = `/song/${song.slug}`;
  const hasCampaign =
    song.campaignId !== null &&
    song.goalCents > 0 &&
    song.status !== 'released';

  const percent = Math.min(
    100,
    Math.max(0, song.percent),
  );

  return (
    <article className="home-song-card">
      <Link
        href={href}
        aria-label={song.title}
        className="home-song-card-art-link"
      >
        {song.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={song.coverPath}
            alt=""
            width={720}
            height={720}
            loading="lazy"
            className="home-song-card-art"
            style={{
              backgroundColor: 'var(--ink-2)',
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
            className="home-song-card-placeholder"
          >
            <Headphones
              size={30}
              strokeWidth={1.25}
            />
          </span>
        )}

        <span
          aria-hidden
          className="home-song-card-treatment"
        />

        <span className="home-song-card-status">
          <StatusBadge
            status={song.status}
            label={labels.status}
          />
        </span>
      </Link>

      <div className="home-song-card-content">
        <div>
          <h3 className="home-song-card-title">
            <Link href={href}>
              {song.title}
            </Link>
          </h3>

          {song.description ? (
            <p className="home-song-card-description">
              {song.description}
            </p>
          ) : null}
        </div>

        {hasCampaign ? (
          <div className="home-song-card-funding">
            <div className="home-song-card-funding-row">
              <span className="numeric">
                {formatCents(cents(song.raisedCents))}
              </span>

              <span className="numeric">
                {percent}%
              </span>
            </div>

            <FundingMeter percent={percent} />

            <p className="home-song-card-supporters">
              <Users
                aria-hidden
                size={14}
                strokeWidth={1.7}
              />

              <span className="numeric">
                {song.supporterCount.toLocaleString()}
              </span>

              <span>{labels.supporters}</span>
            </p>
          </div>
        ) : null}

        <Link
          href={href}
          className="home-song-card-link"
        >
          <span>{labels.viewProject}</span>

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
