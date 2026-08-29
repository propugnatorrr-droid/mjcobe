import { MobileNavToggle } from '@/components/MobileNavToggle';
import {
  PrimaryNavLinks,
  type PrimaryNavLink,
} from '@/components/PrimaryNavLinks';
import { ButtonLink } from '@/components/primitives/Button';
import { Wordmark } from '@/components/primitives/Wordmark';
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

  const links: PrimaryNavLink[] = [
    { href: '/', label: home },
    { href: '/music', label: music },
    { href: '/back', label: backASong },
    { href: '/journey', label: journey },
    { href: '/partners', label: partners },
    { href: '/now', label: mjcobe },
  ];

  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        <div className="site-nav__wordmark">
          <Wordmark sub={sub} />
        </div>

        <PrimaryNavLinks links={links} />

        <div className="site-nav__actions">
          <ButtonLink
            href="/back"
            variant="primary"
            className="site-nav__cta"
          >
            {cta}
          </ButtonLink>

          <MobileNavToggle links={links} />
        </div>
      </div>
    </header>
  );
}
