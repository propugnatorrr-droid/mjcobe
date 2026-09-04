import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileCta } from '@/components/MobileCta';
import { getPublicProduct } from '@/lib/shop/queries';
import { AddToCartButton } from '@/components/shop/AddToCartButton';
import { flagEnabled } from '@/lib/config/settings';
import { text } from '@/lib/copy/site-copy';
import { formatCents, cents } from '@/lib/money/cents';

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!(await flagEnabled('shopEnabled'))) {
    return { title: await text('notfound.title') };
  }
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  return { title: product ? product.title : await text('shop.not_found') };
}

export default async function ProductDetailPage({ params }: Props) {
  if (!(await flagEnabled('shopEnabled'))) {
    notFound();
  }

  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) {
    notFound();
  }

  const [backToShop, inStockLabel, outOfStockLabel, addToCartLabel] = await Promise.all([
    text('shop.back_to_shop'),
    text('shop.in_stock'),
    text('shop.out_of_stock'),
    text('shop.add_to_cart'),
  ]);

  return (
    <main id="main-content" className="surface-ink min-h-screen">
      <SiteNav sub={product.title} />

      <article className="site-shell section-space-compact">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 font-ui text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--champagne)]"
        >
          <ArrowUpRight aria-hidden size={14} className="rotate-180" />
          {backToShop}
        </Link>

        {product.media[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.media[0].path}
            alt=""
            width={1200}
            height={900}
            className="mt-8 aspect-[4/3] w-full rounded-[var(--radius-panel)] object-cover"
            style={{ backgroundColor: 'var(--ink)' }}
          />
        ) : null}

        <h1 className="mt-8 font-display text-[clamp(2rem,6vw,4rem)] uppercase leading-none text-[var(--text)]">
          {product.title}
        </h1>

        {product.description ? (
          <p className="mt-6 max-w-[52ch] text-body text-[var(--text-dim)]">{product.description}</p>
        ) : null}

        {product.variants.length > 0 ? (
          <section className="mt-10 max-w-[52ch]">
            <ul className="flex flex-col gap-3">
              {product.variants.map((variant) => (
                <li
                  key={variant.id}
                  className="flex items-baseline justify-between gap-4 border-b pb-3"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <div>
                    <p className="font-serif text-lg text-[var(--text)]">{variant.name}</p>
                    <p className="mt-1 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em]" style={{ color: variant.inStock ? 'var(--champagne)' : 'var(--text-faint)' }}>
                      {variant.inStock ? inStockLabel : outOfStockLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="whitespace-nowrap font-mono text-base tabular-nums text-[var(--text)]">
                      {formatCents(cents(variant.priceCents))}
                    </span>
                    <AddToCartButton variantId={variant.id} label={addToCartLabel} disabled={!variant.inStock} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>

      <SiteFooter />
      <MobileCta />
    </main>
  );
}
