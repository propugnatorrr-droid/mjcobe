import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileCta } from '@/components/MobileCta';
import { ProductCard } from '@/components/shop/ProductCard';
import { listPublicProducts } from '@/lib/shop/queries';
import { flagEnabled } from '@/lib/config/settings';
import { text } from '@/lib/copy/site-copy';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  if (!(await flagEnabled('shopEnabled'))) {
    return { title: await text('notfound.title') };
  }
  return { title: await text('shop.title') };
}

export default async function ShopPage() {
  if (!(await flagEnabled('shopEnabled'))) {
    notFound();
  }

  const [products, eyebrow, title, intro, empty, viewProduct] = await Promise.all([
    listPublicProducts(),
    text('shop.eyebrow'),
    text('shop.title'),
    text('shop.intro'),
    text('shop.empty'),
    text('shop.view_product'),
  ]);

  return (
    <main id="main-content" className="surface-ink min-h-screen">
      <SiteNav sub={title} />

      <header className="site-shell section-space-compact">
        <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-[var(--champagne)]">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5rem)] uppercase leading-none text-[var(--text)]">
          {title}
        </h1>
        <p className="mt-4 max-w-[52ch] text-body text-[var(--text-dim)]">{intro}</p>
      </header>

      <section className="site-shell section-space-compact pt-0">
        {products.length === 0 ? (
          <div className="panel p-8 sm:p-10">
            <p className="max-w-[52ch] text-base leading-7 text-[var(--text-dim)]">{empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} viewLabel={viewProduct} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
      <MobileCta />
    </main>
  );
}
