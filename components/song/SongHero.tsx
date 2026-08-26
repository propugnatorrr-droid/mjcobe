import Image from 'next/image';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { RevealText } from '@/components/primitives/RevealText';
import { RevealImage } from '@/components/primitives/RevealImage';
import { Rule } from '@/components/primitives/Rule';
import { text } from '@/lib/copy/site-copy';
import type { CopyKey } from '@/lib/copy/defaults';
import type { SongPageData } from '@/lib/song/queries';

/**
 * When no processed cover exists the title becomes the artwork. That reads as
 * a deliberate editorial choice rather than a missing asset, so the page is
 * shippable before the media pipeline runs.
 */
export async function SongHero({
  song,
  campaign,
  cover,
}: Pick<SongPageData, 'song' | 'campaign' | 'cover'>) {
  const statusKey: CopyKey =
    campaign?.status === 'live' ? 'eyebrow.currently_building' : 'eyebrow.live';

  const alt = cover?.altCopyKey
    ? await text(cover.altCopyKey as CopyKey)
    : song.title;

  return (
    <header className="pt-24 md:pt-40">
      <div className="mb-10 flex items-baseline justify-between gap-6">
        <Eyebrow>{await text(statusKey)}</Eyebrow>
        {campaign?.name ? (
          <span className="font-mono text-eyebrow uppercase text-[var(--text-faint)]">
            {campaign.name}
          </span>
        ) : null}
      </div>

      <RevealText
        lines={[song.title]}
        className="font-display text-display text-[var(--text)]"
      />

      {song.description ? (
        <p className="mt-8 max-w-[62ch] text-body text-[var(--text-dim)]">
          {song.description}
        </p>
      ) : null}

      {cover ? (
        <div className="mt-16">
          <RevealImage>
            <Image
              src={cover.path}
              alt={alt}
              width={cover.width ?? 1008}
              height={cover.height ?? 1792}
              placeholder={cover.placeholder ? 'blur' : 'empty'}
              blurDataURL={cover.placeholder ?? undefined}
              sizes="(min-width: 768px) 62vw, 100vw"
              priority
              className="w-full"
            />
          </RevealImage>
        </div>
      ) : (
        <div className="mt-16">
          <Rule strong />
        </div>
      )}
    </header>
  );
}
