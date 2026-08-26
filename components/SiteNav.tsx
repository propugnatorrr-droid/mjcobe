import Link from 'next/link';
import { ButtonLink } from '@/components/primitives/Button';
import { MobileNavToggle } from '@/components/MobileNavToggle';
import { text } from '@/lib/copy/site-copy';

/** PRD §2: HOME | MUSIC | BACK A SONG | JOURNEY | PARTNERS | MJ COBE, plus
 * one persistent CTA. Present on every public page. */
export async function SiteNav() {
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
    <header className="relative border-b" style={{ borderColor: 'var(--line)' }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5 md:px-12">
        <Link href="/" className="font-display text-xl text-[var(--text)]">
          MJ COBE
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-ui text-sm uppercase tracking-[0.04em] text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ButtonLink href="/back" variant="primary" className="!px-5 !py-2.5 text-xs">
            {cta}
          </ButtonLink>
          <MobileNavToggle links={links} />
        </div>
      </div>
    </header>
  );
}
