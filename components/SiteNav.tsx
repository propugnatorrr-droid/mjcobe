import Link from 'next/link';
import { ButtonLink } from '@/components/primitives/Button';
import { Wordmark } from '@/components/primitives/Wordmark';
import { MobileNavToggle } from '@/components/MobileNavToggle';
import { text } from '@/lib/copy/site-copy';

export async function SiteNav({ sub }: { sub?: string }) {
  const [
    home,
    music,
    backASong,
    journey,
    partners,
    mjcobe,
    cta,
  ] = await Promise.all([
    text('nav.home'),
    text('nav.music'),
    text('nav.back_a_song'),
    text('nav.journey'),
    text('nav.partners'),
    text('nav.mj_cobe'),
    text('nav.cta'),
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
      className={[
        'sticky top-0 z-40',
        'h-[var(--header-height-mobile)]',
        'border-b border-[var(--line)]',
        'bg-[rgba(10,10,11,0.97)]',
        'lg:h-[var(--header-height-desktop)]',
      ].join(' ')}
    >
      <div
        className={[
          'mx-auto flex h-full max-w-[92rem] items-center justify-between',
          'gap-4 px-5',
          'md:px-8 lg:gap-7 lg:px-10',
        ].join(' ')}
      >
        <div className="shrink-0">
          <Wordmark sub={sub} />
        </div>

        <nav
          aria-label="Primary navigation"
          className="hidden min-w-0 items-center justify-center lg:flex"
        >
          {links.map((link, index) => (
            <span key={link.href} className="flex items-center">
              {index > 0 ? (
                <span
                  aria-hidden
                  className="px-3 text-[var(--line-strong)] xl:px-4"
                >
                  /
                </span>
              ) : null}

              <Link
                href={link.href}
                className={[
                  'whitespace-nowrap',
                  'font-ui text-[0.6875rem] font-medium uppercase',
                  'tracking-[0.16em] text-[var(--text-dim)]',
                  'transition-colors',
                  '[transition-duration:var(--duration-signature)]',
                  '[transition-timing-function:var(--ease-signature)]',
                  'hover:text-[var(--champagne)]',
                  'focus-visible:outline focus-visible:outline-2',
                  'focus-visible:outline-offset-4',
                  'focus-visible:outline-[var(--champagne)]',
                ].join(' ')}
              >
                {link.label}
              </Link>
            </span>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
<ButtonLink
  href="/back"
  variant="primary"
  className={[
              '!hidden !min-h-10 !px-5 !py-2',
              '!text-[0.625rem] !tracking-[0.14em]',
              'sm:!inline-flex',
            ].join(' ')}
          >
            {cta}
          </ButtonLink>

          <MobileNavToggle links={links} />
        </div>
      </div>
    </header>
  );
}
