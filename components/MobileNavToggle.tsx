'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import type { PrimaryNavLink } from '@/components/PrimaryNavLinks';

function isCurrentRoute(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNavToggle({
  links,
  ctaLabel,
}: {
  links: PrimaryNavLink[];
  ctaLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstLinkRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      setOpen(false);

      window.requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="site-nav__mobile">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        className="site-nav__menu-trigger"
      >
        {open ? (
          <X aria-hidden size={20} strokeWidth={1.7} />
        ) : (
          <Menu aria-hidden size={20} strokeWidth={1.7} />
        )}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMenu}
            className="site-nav__mobile-backdrop"
          />

          <nav
            id={menuId}
            aria-label="Mobile navigation"
            className="site-nav__mobile-panel"
          >
            <div className="site-nav__mobile-links">
              {links.map((link, index) => {
                const active = isCurrentRoute(pathname, link.href);

                return (
                  <Link
                    ref={index === 0 ? firstLinkRef : undefined}
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    aria-current={active ? 'page' : undefined}
                    className="site-nav__mobile-link"
                    data-active={active ? 'true' : 'false'}
                  >
                    <span>{link.label}</span>

                    <span
                      aria-hidden
                      className="site-nav__mobile-link-mark"
                    >
                      {active ? '—' : '↗'}
                    </span>
                  </Link>
                );
              })}
            </div>

            <Link
              href="/back"
              onClick={closeMenu}
              className="site-nav__mobile-primary"
            >
              {ctaLabel}
            </Link>
          </nav>
        </>
      ) : null}
    </div>
  );
}
