import Link from 'next/link';
import { ButtonLink } from '@/components/primitives/Button';
import { Wordmark } from '@/components/primitives/Wordmark';
import { MobileNavToggle } from '@/components/MobileNavToggle';
import { text } from '@/lib/copy/site-copy';

/** PRD §2: HOME | MUSIC | BACK A SONG | JOURNEY | PARTNERS | MJ COBE, plus
 * one persistent CTA. Centred with pipe separators, matching the mockups. */
export async function SiteNav({ sub }: { sub?: string }) {
  const [home, music, backASong, journey, partners, mjcobe, cta] = await Promise.all([
    text('nav.home'), text('nav.music'), text('nav.back_a_song'),
    text('nav.journey'), text('nav.partners'), text('nav.mj_cobe'), text('nav.cta'),
  ]);

  const links = [
    { href: '/', label: home },
    { href: '/music', label: music },
    { href: '/back', label: backASong },
    { href: '/journey', label: journey },
    { href: '/partners', label: partners },
    { href: '/now', label: mjcobe },
  ];

  return (
    <header
      className="relative z-30 border-b"
      style={{ borderColor: 'var(--line)', background: 'var(--ink)' }}
    >
      <div className="mx-auto flex max-w-[92rem] items-center justify-between gap-6 px-6 py-5 md:px-10">
        <Wordmark sub={sub} />

        <nav className="hidden items-center lg:flex">
          {links.map((l, i) => (
            <span key={l.href} className="flex items-center">
              {i > 0 ? (
                <span aria-hidden className="px-4 text-[var(--line-strong)]">|</span>
              ) : null}
              <Link
                href={l.href}
                className="font-ui text-xs uppercase tracking-[0.16em] text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--champagne)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--champagne)]"
              >
                {l.label}
              </Link>
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ButtonLink
            href="/back"
            variant="ghost"
            glow
            className="!hidden !px-5 !py-2.5 text-[0.6875rem] tracking-[0.14em] sm:!inline-flex"
          >
            {cta}
          </ButtonLink>
          <MobileNavToggle links={links} />
        </div>
      </div>
    </header>
  );
}
