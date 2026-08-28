import Link from 'next/link';
import {
  Crown,
  Instagram,
  Music2,
  Play,
  Video,
  Youtube,
  type LucideIcon,
} from 'lucide-react';
import { setting } from '@/lib/config/settings';
import { text } from '@/lib/copy/site-copy';

type SocialDefinition = {
  slug: string;
  settingKey:
    | 'socialInstagramUrl'
    | 'socialYoutubeUrl'
    | 'socialTiktokUrl'
    | 'socialSpotifyUrl'
    | 'socialAppleMusicUrl';
  label: string;
  icon: LucideIcon;
};

const SOCIALS: SocialDefinition[] = [
  {
    slug: 'instagram',
    settingKey: 'socialInstagramUrl',
    label: 'Instagram',
    icon: Instagram,
  },
  {
    slug: 'youtube',
    settingKey: 'socialYoutubeUrl',
    label: 'YouTube',
    icon: Youtube,
  },
  {
    slug: 'tiktok',
    settingKey: 'socialTiktokUrl',
    label: 'TikTok',
    icon: Video,
  },
  {
    slug: 'spotify',
    settingKey: 'socialSpotifyUrl',
    label: 'Spotify',
    icon: Music2,
  },
  {
    slug: 'apple-music',
    settingKey: 'socialAppleMusicUrl',
    label: 'Apple Music',
    icon: Play,
  },
];

export async function SiteFooter() {
  const [
    tagline,
    rights,
    built,
    terms,
    privacy,
    contact,
    mediaKit,
  ] = await Promise.all([
    text('footer.tagline'),
    text('footer.rights'),
    text('footer.built'),
    text('footer.terms'),
    text('footer.privacy'),
    text('footer.contact'),
    text('footer.media_kit'),
  ]);

  const socials = (
    await Promise.all(
      SOCIALS.map(async (social) => ({
        ...social,
        url: await setting(social.settingKey),
      })),
    )
  ).filter((social) => social.url);

  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t border-[var(--line)]">
      <div className="site-shell py-10 sm:py-12">
        <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Crown
              aria-hidden
              size={16}
              strokeWidth={1.7}
              color="var(--champagne)"
            />

            <span className="font-serif text-xl tracking-[0.14em] text-gold">
              MJ COBE
            </span>

            <span
              aria-hidden
              className="hidden text-[var(--line-strong)] sm:inline"
            >
              /
            </span>

            <span className="hidden text-[0.625rem] uppercase tracking-[0.24em] text-[var(--text-dim)] sm:inline">
              {tagline}
            </span>
          </div>

          {socials.length > 0 ? (
            <div className="flex items-center gap-3">
              {socials.map((social) => {
                const Icon = social.icon;

                return (
                  <Link
                    key={social.slug}
                    href={`/api/go/${social.slug}`}
                    aria-label={social.label}
                    title={social.label}
                    className={[
                      'flex h-10 w-10 items-center justify-center',
                      'rounded-full border border-[var(--line)]',
                      'text-[var(--text-dim)]',
                      'transition-[color,border-color,background-color]',
                      '[transition-duration:var(--duration-signature)]',
                      '[transition-timing-function:var(--ease-signature)]',
                      'hover:border-[var(--champagne)]',
                      'hover:bg-[rgba(201,162,39,0.06)]',
                      'hover:text-[var(--champagne)]',
                    ].join(' ')}
                  >
                    <Icon
                      aria-hidden
                      size={17}
                      strokeWidth={1.7}
                    />
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>

        <div
          className={[
            'mt-8 flex flex-col gap-5 border-t border-[var(--line)] pt-6',
            'text-[0.625rem] uppercase tracking-[0.18em]',
            'text-[var(--text-dim)]',
            'lg:flex-row lg:items-center lg:justify-between',
          ].join(' ')}
        >
          <span>
            © {year} MJ COBE. {rights}
          </span>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-6 gap-y-3"
          >
            <Link
              href="/partners"
              className="transition-colors hover:text-[var(--champagne)]"
            >
              {mediaKit}
            </Link>

            <Link
              href="/legal/terms"
              className="transition-colors hover:text-[var(--champagne)]"
            >
              {terms}
            </Link>

            <Link
              href="/legal/privacy"
              className="transition-colors hover:text-[var(--champagne)]"
            >
              {privacy}
            </Link>

            <Link
              href="/legal/contact"
              className="transition-colors hover:text-[var(--champagne)]"
            >
              {contact}
            </Link>
          </nav>

          <span className="text-[var(--champagne)]">
            {built}
          </span>
        </div>
      </div>
    </footer>
  );
}
