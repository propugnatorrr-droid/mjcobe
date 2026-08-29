'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type PrimaryNavLink = {
  href: string;
  label: string;
};

function isCurrentRoute(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNavLinks({
  links,
}: {
  links: PrimaryNavLink[];
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="site-nav__desktop-links"
    >
      {links.map((link) => {
        const active = isCurrentRoute(pathname, link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className="site-nav__link"
            data-active={active ? 'true' : 'false'}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
