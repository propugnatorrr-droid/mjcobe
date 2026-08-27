import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { AudioPreview } from '@/components/song/AudioPreview';
import { StreamingLinks } from '@/components/song/StreamingLinks';
import { StatusBadge } from '@/components/primitives/StatusBadge';
import { CatalogCampaignStats } from '@/components/catalog/CatalogCampaignStats';
import type { CatalogSong } from '@/lib/catalog/queries';

export type CatalogCardLabels = {
  status: string;
  supporters: string;
  joinJourney: string;
  previewComingSoon: string;
};

type CatalogSongCardProps = {
  song: CatalogSong;
  labels: CatalogCardLabels;
};

export function CatalogSongCard({
  song,
  labels,
}: CatalogSongCardProps) {
  const href = `/song/${song.slug}`;
  const showCampaign =
    song.goalCents > 0 && song.status !== 'released';

  return (
    <article
      className={[
        'catalog-song-card panel panel-interactive group',
        'min-w-0 overflow-hidden',
      ].join(' ')}
    >
      <Link
        href={href}
        aria-label={song.title}
        className="catalog-song-art relative block overflow-hidden bg-[var(--ink)]"
      >
        {song.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={song.coverPath}
            alt=""
            width={720}
            height={720}
            loading="lazy"
            className={[
              'h-full w-full object-cover',
              'transition-[filter,transform]',
              '[transition-duration:var(--duration-signature)]',
              '[transition-timing-function:var(--ease-signature)]',
              'group-hover:brightness-110',
            ].join(' ')}
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
            className="block h-full w-full bg-[var(--ink)]"
          />
        )}

        <span
          aria-hidden
          className={[
            'pointer-events-none absolute inset-0',
            'border border-transparent',
            'transition-colors',
            '[transition-duration:var(--duration-signature)]',
            'group-hover:border-[rgba(201,162,39,0.52)]',
          ].join(' ')}
        />
      </Link>

      <div className="catalog-song-content flex min-w-0 flex-1 flex-col p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-[1.65rem] leading-[1.02] tracking-[-0.015em] text-[var(--text)]">
              <Link
                href={href}
                className="transition-colors hover:text-[var(--champagne)]"
              >
                {song.title}
              </Link>
            </h2>
          </div>

          <StatusBadge
            status={song.status}
            label={labels.status}
          />
        </div>

        {song.description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-dim)]">
            {song.description}
          </p>
        ) : null}

        <div className="mt-5">
          <AudioPreview
            src={song.audioPath}
            previewStartMs={song.previewStartMs}
            previewEndMs={song.previewEndMs}
            comingSoonLabel={labels.previewComingSoon}
          />
        </div>

        <div className="mt-5">
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
        </div>

        <div className="mt-auto pt-6">
          <Link
            href={href}
            className={[
              'flex min-h-11 w-full items-center justify-center gap-2',
              'rounded-full border border-[var(--line)]',
              'px-5 py-3',
              'font-ui text-[0.6875rem] font-semibold uppercase',
              'tracking-[0.14em] text-[var(--text-dim)]',
              'transition-[color,border-color,background-color]',
              '[transition-duration:var(--duration-signature)]',
              '[transition-timing-function:var(--ease-signature)]',
              'hover:border-[var(--champagne)]',
              'hover:bg-[rgba(201,162,39,0.07)]',
              'hover:text-[var(--champagne)]',
            ].join(' ')}
          >
            {labels.joinJourney}
            <ArrowUpRight aria-hidden size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
