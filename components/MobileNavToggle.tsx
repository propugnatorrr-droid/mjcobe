'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function MobileNavToggle({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menu"
        className="flex items-center justify-center rounded-full p-2 text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
      >
        {open ? <X aria-hidden size={22} /> : <Menu aria-hidden size={22} />}
      </button>

      {open ? (
        <nav
          className="absolute inset-x-0 top-full z-50 flex flex-col gap-1 border-b px-6 py-6"
          style={{ borderColor: 'var(--line)', background: 'var(--ink)' }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-[var(--radius-panel)] px-3 py-3 font-ui text-sm uppercase tracking-[0.04em] text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
