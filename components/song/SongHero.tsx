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

/**
 * Full-bleed editorial hero: the cover art sits on the artwork itself, with
 * the serif title and the preview player overlaid. When no processed cover
 * exists the title carries the frame on its own, so the page is shippable
 * before the media pipeline runs.
 */
export async function SongHero({
  song,
  campaign,
  cover,
  audio,
}: Pick<SongPageData, 'song' | 'campaign' | 'cover' | 'audio'>) {
  const alt = cover?.altCopyKey ? await text(cover.altCopyKey as CopyKey) : song.title;
  const comingSoonLabel = await text('song.preview_coming_soon');
  const artistName = await text('hero.artist_name');
  const statusLabel = await text(STATUS_COPY[song.status] ?? 'music.vault');
  const previewLabel = await text('song.preview_window');

  return (
    <header className="relative isolate overflow-hidden">
      {/* Backdrop: the cover, blurred and darkened into a stage. */}
      {cover ? (
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image
            src={cover.path}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ filter: 'blur(28px) saturate(0.8)', transform: 'scale(1.15)' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(10,10,11,0.72) 0%, rgba(10,10,11,0.86) 55%, var(--ink) 100%)',
            }}
          />
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[92rem] grid-cols-1 items-center gap-10 px-6 py-14 md:px-10 md:py-16 lg:grid-cols-[22rem_1fr]">
        {cover ? (
          <div className="mx-auto w-full max-w-[22rem] lg:mx-0">
            <Image
              src={cover.path}
              alt={alt}
              width={cover.width ?? 1008}
              height={cover.height ?? 1008}
              placeholder={cover.placeholder ? 'blur' : 'empty'}
              blurDataURL={cover.placeholder ?? undefined}
              sizes="(min-width: 1024px) 22rem, 100vw"
              priority
              className="aspect-square w-full rounded-sm object-cover"
              style={{ outline: '1px solid var(--line-strong)' }}
            />
          </div>
        ) : null}

        <div className="min-w-0">
          <p className="font-ui text-[0.625rem] uppercase tracking-[0.42em] text-[var(--champagne)]">
            {artistName}
          </p>

          <h1 className="mt-3 font-serif text-serif-display text-[var(--text)]">
            {song.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <StatusBadge status={song.status} label={statusLabel} />
            {campaign?.name ? (
              <span className="font-ui text-[0.625rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                {campaign.name}
              </span>
            ) : null}
          </div>

          {song.description ? (
            <p className="mt-5 max-w-[58ch] text-body text-[var(--text-dim)]">
              {song.description}
            </p>
          ) : null}

          <div className="mt-7 max-w-2xl">
            <AudioPreview
              src={audio?.path ?? null}
              previewStartMs={song.previewStartMs}
              previewEndMs={song.previewEndMs}
              comingSoonLabel={comingSoonLabel}
            />
            <p className="mt-2 text-center font-ui text-[0.625rem] uppercase tracking-[0.24em] text-[var(--text-faint)]">
              {previewLabel}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
