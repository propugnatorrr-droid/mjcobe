import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { text } from '@/lib/copy/site-copy';

export async function MobileCta({
  href = '/back',
}: {
  href?: string;
}) {
  const label = await text('nav.cta');

  return (
    <>
      <div
        aria-hidden
        className="mobile-cta__spacer"
      />

      <aside
        aria-label={label}
        className="mobile-cta"
      >
        <Link
          href={href}
          className="mobile-cta__link"
        >
          <span>{label}</span>

          <ArrowUpRight
            aria-hidden
            size={17}
            strokeWidth={1.8}
          />
        </Link>
      </aside>
    </>
  );
}
