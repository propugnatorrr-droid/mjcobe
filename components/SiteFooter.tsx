import Link from 'next/link';
import { Crown } from 'lucide-react';
import { text } from '@/lib/copy/site-copy';
import { setting } from '@/lib/config/settings';

const SOCIALS = [
  { slug: 'instagram', settingKey: 'socialInstagramUrl', label: 'IG' },
  { slug: 'youtube', settingKey: 'socialYoutubeUrl', label: 'YT' },
  { slug: 'tiktok', settingKey: 'socialTiktokUrl', label: 'TT' },
  { slug: 'spotify', settingKey: 'socialSpotifyUrl', label: 'SP' },
  { slug: 'apple-music', settingKey: 'socialAppleMusicUrl', label: 'AM' },
] as const;

export async function SiteFooter() {
  const [tagline, rights, built, terms, privacy, contact, mediaKit] = await Promise.all([
    text('footer.tagline'), text('footer.rights'), text('footer.built'),
    text('footer.terms'), text('footer.privacy'), text('footer.contact'),
    text('footer.media_kit'),
  ]);

  const socials = (
    await Promise.all(
      SOCIALS.map(async (s) => ({ ...s, url: await setting(s.settingKey) })),
    )
  ).filter((s) => s.url);

  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t" style={{ borderColor: 'var(--line)' }}>
      <div className="mx-auto max-w-[92rem] px-6 py-10 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Crown aria-hidden size={16} color="var(--champagne)" />
            <span className="font-serif text-xl tracking-[0.14em] text-gold">MJ COBE</span>
            <span aria-hidden className="text-[var(--line-strong)]">|</span>
            <span className="font-ui text-[0.625rem] uppercase tracking-[0.24em] text-[var(--text-dim)]">
              {tagline}
            </span>
          </div>

          {socials.length > 0 ? (
            <div className="flex items-center gap-3">
              {socials.map((s) => (
                <Link
                  key={s.slug}
                  href={`/api/go/${s.slug}`}
                  aria-label={s.slug}
                  className="flex h-8 w-8 items-center justify-center rounded-full border font-ui text-[0.625rem] tracking-[0.06em] text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--champagne)] hover:text-[var(--champagne)]"
                  style={{ borderColor: 'var(--line)' }}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div
          className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t pt-6 font-ui text-[0.625rem] uppercase tracking-[0.2em] text-[var(--text-faint)]"
          style={{ borderColor: 'var(--line)' }}
        >
          <span>© {year} MJ COBE. {rights}</span>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/partners" className="hover:text-[var(--champagne)]">{mediaKit}</Link>
            <Link href="/legal/terms" className="hover:text-[var(--champagne)]">{terms}</Link>
            <Link href="/legal/privacy" className="hover:text-[var(--champagne)]">{privacy}</Link>
            <Link href="/legal/contact" className="hover:text-[var(--champagne)]">{contact}</Link>
          </nav>
          <span className="text-[var(--champagne)]">{built}</span>
        </div>
      </div>
    </footer>
  );
}
