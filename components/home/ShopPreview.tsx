import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { ProductCard } from '@/components/shop/ProductCard';
import type { PublicProduct } from '@/lib/shop/queries';

type ShopPreviewProps = {
  products: PublicProduct[];
  heading: string;
  cta: string;
  viewProductLabel: string;
};

/** Same shape as components/home/FeedPreview.tsx — a static grid, not a
 * carousel, and returns null rather than fabricate placeholder content
 * when there's nothing eligible to show. Featured products only (see
 * lib/home/queries.ts), capped by the homeShopPreviewCount setting. */
export function ShopPreview({ products, heading, cta, viewProductLabel }: ShopPreviewProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="home-shop-heading" className="home-feed-preview">
      <div className="site-shell">
        <div className="home-partner-strip-heading">
          <div id="home-shop-heading">
            <SectionHeading>{heading}</SectionHeading>
          </div>

          <Link href="/shop" className="home-partner-strip-view-all">
            <span>{cta}</span>
            <ArrowUpRight aria-hidden size={15} strokeWidth={1.8} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} viewLabel={viewProductLabel} />
          ))}
        </div>
      </div>
    </section>
  );
}
