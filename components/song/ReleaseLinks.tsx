import {
  ExternalLink,
  Headphones,
  Music2,
  PlayCircle,
} from 'lucide-react';
import {
  Eyebrow,
} from '@/components/primitives/Eyebrow';
import {
  text,
} from '@/lib/copy/site-copy';
import type {
  SongPageData,
} from '@/lib/song/queries';

type ReleaseLink = {
  href: string;
  label: string;
  icon: typeof Headphones;
};

export async function ReleaseLinks({
  song,
}: {
  song: SongPageData['song'];
}) {
  const [
    heading,
    spotifyLabel,
    appleMusicLabel,
    youtubeLabel,
    musicVideoLabel,
  ] = await Promise.all([
    text('song.listen.heading'),
    text('song.listen.spotify'),
    text('song.listen.apple_music'),
    text('song.listen.youtube'),
    text('song.listen.music_video'),
  ]);

  const links: ReleaseLink[] = [];

  if (song.spotifyUrl) {
    links.push({
      href: song.spotifyUrl,
      label: spotifyLabel,
      icon: Headphones,
    });
  }

  if (song.appleMusicUrl) {
    links.push({
      href: song.appleMusicUrl,
      label: appleMusicLabel,
      icon: Music2,
    });
  }

  if (song.youtubeUrl) {
    links.push({
      href: song.youtubeUrl,
      label: youtubeLabel,
      icon: PlayCircle,
    });
  }

  if (song.musicVideoUrl) {
    links.push({
      href: song.musicVideoUrl,
      label: musicVideoLabel,
      icon: PlayCircle,
    });
  }

  if (links.length === 0) {
    return null;
  }

  return (
    <section className="site-shell py-12 md:py-16">
      <div className="flex items-center gap-5">
        <Eyebrow>
          {heading}
        </Eyebrow>

        <span
          aria-hidden
          className="rule-gold h-px min-w-8 flex-1 opacity-40"
        />
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <a
              key={`${link.label}:${link.href}`}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={[
                'group flex min-h-14',
                'items-center gap-4',
                'rounded-[var(--radius-panel)]',
                'border border-[var(--line)]',
                'bg-[var(--ink-2)]',
                'px-5 py-4',
                'font-ui text-xs font-semibold',
                'uppercase tracking-[0.12em]',
                'text-[var(--text)]',
                'transition-[border-color,color]',
                '[transition-duration:var(--duration-signature)]',
                'hover:border-[var(--champagne)]',
                'hover:text-[var(--champagne)]',
                'focus-visible:outline',
                'focus-visible:outline-2',
                'focus-visible:outline-offset-2',
                'focus-visible:outline-[var(--champagne)]',
              ].join(' ')}
            >
              <Icon
                aria-hidden
                size={18}
                strokeWidth={1.8}
                className="shrink-0 text-[var(--champagne)]"
              />

              <span className="min-w-0 flex-1">
                {link.label}
              </span>

              <ExternalLink
                aria-hidden
                size={15}
                strokeWidth={1.8}
                className="shrink-0 text-[var(--text-dim)] transition-colors group-hover:text-[var(--champagne)]"
              />
            </a>
          );
        })}
      </div>
    </section>
  );
}
