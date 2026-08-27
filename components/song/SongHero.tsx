import Image from 'next/image';
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
}: Pick<SongPageData, 'song' | 'campaign' | 'cover' | 'audio'>) {
  const [
    alt,
    comingSoonLabel,
    artistName,
    statusLabel,
    previewLabel,
  ] = await Promise.all([
    cover?.altCopyKey
      ? text(cover.altCopyKey as CopyKey)
      : Promise.resolve(song.title),
    text('song.preview_coming_soon'),
    text('hero.artist_name'),
    text(STATUS_COPY[song.status] ?? 'music.vault'),
    text('song.preview_window'),
  ]);

  return (
    <header
      aria-labelledby="song-title"
      className="song-hero relative isolate overflow-hidden"
    >
      {cover ? (
        <div aria-hidden className="absolute inset-0 -z-20">
          <Image
            src={cover.path}
            alt=""
            fill
            priority
            sizes="100vw"
            className="song-hero-backdrop object-cover"
          />

          <div className="song-hero-backdrop-treatment absolute inset-0" />
        </div>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-[var(--ink)]"
        />
      )}

      <div
        className={[
          'site-shell grid items-center',
          'min-h-[42rem] grid-cols-1 gap-10',
          'py-12 sm:py-16',
          'lg:min-h-[46rem]',
          'lg:grid-cols-[minmax(20rem,31rem)_minmax(0,1fr)]',
          'lg:gap-16 lg:py-20',
        ].join(' ')}
      >
        <div className="relative mx-auto w-full max-w-[31rem] lg:mx-0">
          <div
            aria-hidden
            className={[
              'song-vinyl absolute right-[-5%] top-1/2',
              'hidden aspect-square w-[84%] -translate-y-1/2',
              'rounded-full lg:block',
            ].join(' ')}
          />

          {cover ? (
            <div className="relative z-10">
              <Image
                src={cover.path}
                alt={alt}
                width={cover.width ?? 1008}
                height={cover.height ?? 1008}
                placeholder={cover.placeholder ? 'blur' : 'empty'}
                blurDataURL={cover.placeholder ?? undefined}
                sizes="(min-width: 1024px) 31rem, (min-width: 640px) 70vw, 100vw"
                priority
                className={[
                  'aspect-square w-full object-cover',
                  'rounded-[var(--radius-panel)]',
                  'border border-[var(--line-strong)]',
                  'shadow-[0_30px_80px_rgba(0,0,0,0.5)]',
                ].join(' ')}
              />

              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[var(--radius-panel)] ring-1 ring-inset ring-white/5"
              />
            </div>
          ) : (
            <div
              aria-hidden
              className={[
                'relative z-10 aspect-square w-full',
                'rounded-[var(--radius-panel)]',
                'border border-[var(--line)] bg-[var(--ink-2)]',
              ].join(' ')}
            />
          )}
        </div>

        <div className="relative z-10 min-w-0">
          <p className="font-ui text-[0.6875rem] font-semibold uppercase tracking-[0.36em] text-[var(--champagne)]">
            {artistName}
          </p>

          <h1
            id="song-title"
            className={[
              'mt-4 max-w-[13ch]',
              'font-serif text-[clamp(3rem,9vw,7rem)]',
              'leading-[0.9] tracking-[-0.035em]',
              'text-[var(--text)]',
            ].join(' ')}
          >
            {song.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <StatusBadge
              status={song.status}
              label={statusLabel}
            />

            {campaign?.name ? (
              <span className="font-ui text-[0.625rem] font-medium uppercase tracking-[0.2em] text-[var(--text-dim)]">
                {campaign.name}
              </span>
            ) : null}
          </div>

          {song.description ? (
            <p className="mt-6 max-w-[56ch] text-base leading-7 text-[var(--text-dim)] sm:text-lg sm:leading-8">
              {song.description}
            </p>
          ) : null}

          <div className="mt-8 max-w-[46rem]">
            <AudioPreview
              src={audio?.path ?? null}
              previewStartMs={song.previewStartMs}
              previewEndMs={song.previewEndMs}
              comingSoonLabel={comingSoonLabel}
            />

            <p className="mt-3 text-center font-ui text-[0.625rem] font-medium uppercase tracking-[0.22em] text-[var(--text-faint)]">
              {previewLabel}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
