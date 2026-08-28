import Link from 'next/link';
import { Disc3 } from 'lucide-react';
import { text } from '@/lib/copy/site-copy';

export async function MobileCta({ href = '/back' }: { href?: string }) {
  const label = await text('nav.cta');

  return (
    <>
      <div
        aria-hidden
        className="h-[calc(5.75rem+env(safe-area-inset-bottom))] sm:hidden"
      />

      <aside
        aria-label="Back a record"
        className={[
          'fixed inset-x-0 bottom-0 z-40 sm:hidden',
          'border-t border-[var(--line)]',
          'bg-[rgba(10,10,11,0.98)]',
          'px-4 pt-3',
        ].join(' ')}
        style={{
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        }}
      >
        <Link
          href={href}
          className={[
            'bg-gold',
            'flex min-h-13 w-full items-center justify-center gap-3',
            'rounded-full px-6 py-3.5',
            'font-ui text-xs font-semibold uppercase tracking-[0.14em]',
            'text-[var(--ink)]',
            'transition-[filter,transform,box-shadow]',
            '[transition-duration:var(--duration-signature)]',
            '[transition-timing-function:var(--ease-signature)]',
            'hover:brightness-110',
            'active:translate-y-px',
            'focus-visible:outline focus-visible:outline-2',
            'focus-visible:outline-offset-2',
            'focus-visible:outline-[var(--champagne)]',
          ].join(' ')}
        >
          <Disc3 aria-hidden size={18} strokeWidth={1.8} />
          <span>{label}</span>
        </Link>
      </aside>
    </>
  );
}
