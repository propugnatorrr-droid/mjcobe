import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { PublicProduct } from '@/lib/shop/queries';
import { formatCents, cents } from '@/lib/money/cents';

export function ProductCard({ product, viewLabel }: { product: PublicProduct; viewLabel: string }) {
  const href = `/shop/${product.slug}`;
  const cheapest = product.variants[0];
  const cover = product.media[0];

  return (
    <article className="panel panel-interactive flex flex-col overflow-hidden">
      <Link href={href} aria-label={product.title} className="block">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.path}
            alt=""
            width={800}
            height={600}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
            style={{
              backgroundColor: 'var(--ink)',
              backgroundImage: cover.placeholder ? `url("${cover.placeholder}")` : undefined,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h2 className="font-serif text-xl leading-tight text-[var(--text)]">
          <Link href={href}>{product.title}</Link>
        </h2>

        {cheapest ? (
          <span className="font-mono text-base tabular-nums text-[var(--champagne)]">{formatCents(cents(cheapest.priceCents))}</span>
        ) : null}

        <Link
          href={href}
          className="mt-auto inline-flex w-fit items-center gap-2 pt-2 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--champagne)]"
        >
          {viewLabel}
          <ArrowUpRight aria-hidden size={13} />
        </Link>
      </div>
    </article>
  );
}
