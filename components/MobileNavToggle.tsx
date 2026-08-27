'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

type NavLink = {
  href: string;
  label: string;
};

export function MobileNavToggle({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstLinkRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;

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

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        className={[
          'flex h-11 w-11 items-center justify-center rounded-full',
          'border border-[var(--line)]',
          'bg-[var(--ink-2)] text-[var(--text)]',
          'transition-[color,border-color,background-color]',
          '[transition-duration:var(--duration-signature)]',
          '[transition-timing-function:var(--ease-signature)]',
          'hover:border-[var(--champagne)] hover:text-[var(--champagne)]',
          'focus-visible:outline focus-visible:outline-2',
          'focus-visible:outline-offset-2',
          'focus-visible:outline-[var(--champagne)]',
        ].join(' ')}
      >
        {open ? <X aria-hidden size={20} /> : <Menu aria-hidden size={20} />}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMenu}
            className="fixed inset-0 top-[var(--header-height-mobile)] z-40 cursor-default bg-black/70 lg:hidden"
          />

          <nav
            id={menuId}
            aria-label="Mobile navigation"
            className={[
              'absolute inset-x-0 top-full z-50',
              'border-b border-[var(--line)]',
              'bg-[var(--ink)] px-5 pb-7 pt-3',
              'shadow-[0_24px_60px_rgba(0,0,0,0.55)]',
            ].join(' ')}
          >
            <div className="mx-auto flex max-w-[92rem] flex-col">
              {links.map((link, index) => (
                <Link
                  ref={index === 0 ? firstLinkRef : undefined}
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={[
                    'flex min-h-14 items-center justify-between',
                    'border-b border-[var(--line)]',
                    'font-ui text-sm font-medium uppercase tracking-[0.14em]',
                    'text-[var(--text-dim)]',
                    'transition-colors',
                    '[transition-duration:var(--duration-signature)]',
                    'hover:text-[var(--champagne)]',
                    'focus-visible:outline focus-visible:outline-2',
                    'focus-visible:outline-offset-[-2px]',
                    'focus-visible:outline-[var(--champagne)]',
                  ].join(' ')}
                >
                  <span>{link.label}</span>
                  <span
                    aria-hidden
                    className="text-[var(--champagne)]"
                  >
                    /
                  </span>
                </Link>
              ))}
            </div>
          </nav>
        </>
      ) : null}
    </div>
  );
}
