import Link from 'next/link';
import { Disc3 } from 'lucide-react';
import { text } from '@/lib/copy/site-copy';

/**
 * PRD §2: the back-a-record CTA has to stay visible on mobile. The desktop
 * nav carries it above `sm`; below that it docks here. Pages with their own
 * docked bar (the song page's SupportBar) must not also render this.
 */
export async function MobileCta({ href = '/back' }: { href?: string }) {
  const label = await text('nav.cta');

  return (
    <>
      {/* Reserves scroll room so the bar never covers the last element. */}
      <div aria-hidden className="h-24 sm:hidden" />
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 sm:hidden"
        style={{ borderColor: 'var(--line)', background: 'var(--ink)' }}
      >
        <Link
          href={href}
          className="bg-gold flex items-center justify-center gap-3 rounded-full py-3.5 font-ui text-sm font-medium uppercase tracking-[0.12em] text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
          style={{ boxShadow: 'var(--glow-champagne)' }}
        >
          <Disc3 aria-hidden size={18} />
          {label}
        </Link>
      </div>
    </>
  );
}
