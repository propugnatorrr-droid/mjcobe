import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { ShopCheckoutForm } from '@/components/shop/ShopCheckoutForm';
import { RemoveFromCartButton } from '@/components/shop/RemoveFromCartButton';
import { CART_COOKIE_NAME, parseCart } from '@/lib/shop/cart';
import { getVariantForCheckout } from '@/lib/shop/queries';
import { flagEnabled } from '@/lib/config/settings';
import { text } from '@/lib/copy/site-copy';
import { formatCents, cents } from '@/lib/money/cents';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  if (!(await flagEnabled('shopEnabled'))) {
    return { title: await text('notfound.title') };
  }
  return { title: await text('shop_checkout.title'), robots: { index: false, follow: false } };
}

export default async function ShopCheckoutPage() {
  if (!(await flagEnabled('shopEnabled'))) {
    notFound();
  }

  const cookieStore = await cookies();
  const cartLines = parseCart(cookieStore.get(CART_COOKIE_NAME)?.value);

  const [
    title, emptyTitle, emptyBody, browseShop, itemsHeading, removeLabel, subtotalLabel, shippingLabel,
    shippingFreeLabel, totalLabel, emailLabel, shippingHeading, recipientNameLabel, line1Label, line2Label,
    cityLabel, regionLabel, postalCodeLabel, countryLabel, consentLabel, submit, paymentHeading, secureBody,
    notConfigured, failed, declined, retry, processing, doNotClose, working, errorGeneric, errorEmail,
    errorConsent, errorAddress, errorSoldOut, errorUnavailable, errorDeclined, shippingTaxNote,
  ] = await Promise.all([
    text('shop_checkout.title'), text('shop_checkout.empty_title'), text('shop_checkout.empty_body'),
    text('shop_checkout.browse_shop'), text('shop_checkout.items_heading'), text('shop_checkout.remove'),
    text('shop_checkout.subtotal'), text('shop_checkout.shipping'), text('shop_checkout.shipping_free'),
    text('shop_checkout.total'), text('shop_checkout.email'), text('shop_checkout.shipping_heading'),
    text('shop_checkout.recipient_name'), text('shop_checkout.line1'), text('shop_checkout.line2'),
    text('shop_checkout.city'), text('shop_checkout.region'), text('shop_checkout.postal_code'),
    text('shop_checkout.country'), text('shop_checkout.consent'), text('shop_checkout.submit'),
    text('shop_checkout.payment_heading'), text('tickets_checkout.secure_body'), text('tickets_checkout.not_configured'),
    text('tickets_checkout.failed'), text('tickets_checkout.declined'), text('tickets_checkout.retry'),
    text('tickets_checkout.processing'), text('tickets_checkout.do_not_close'), text('tickets_checkout.working'),
    text('shop_checkout.error_generic'), text('shop_checkout.error_email'), text('shop_checkout.error_consent'),
    text('shop_checkout.error_address'), text('shop_checkout.error_sold_out'), text('shop_checkout.error_unavailable'),
    text('shop_checkout.error_declined'), text('shop_checkout.shipping_tax_note'),
  ]);

  if (cartLines.length === 0) {
    return (
      <main id="main-content" className="surface-ink min-h-screen">
        <SiteNav sub={title} />
        <header className="site-shell section-space-compact">
          <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none text-[var(--text)]">
            {emptyTitle}
          </h1>
          <p className="mt-4 max-w-[52ch] text-body text-[var(--text-dim)]">{emptyBody}</p>
          <Link href="/shop" className="mt-6 inline-flex font-ui text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--champagne)] hover:opacity-80">
            {browseShop}
          </Link>
        </header>
        <SiteFooter />
      </main>
    );
  }

  const resolved = await Promise.all(cartLines.map((line) => getVariantForCheckout(line.variantId)));
  const items = cartLines
    .map((line, i) => ({ line, variant: resolved[i] }))
    .filter((entry): entry is { line: typeof cartLines[number]; variant: NonNullable<(typeof resolved)[number]> } => entry.variant !== null);

  const subtotalCents = items.reduce((sum, item) => sum + item.variant.priceCents * item.line.quantity, 0);
  const needsShipping = items.some((item) => item.variant.shippingRequired);

  return (
    <main id="main-content" className="surface-ink min-h-screen">
      <SiteNav sub={title} />

      <header className="site-shell section-space-compact">
        <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none text-[var(--text)]">
          {title}
        </h1>
      </header>

      <section className="site-shell section-space-compact pt-0">
        <div className="max-w-xl">
          <h2 className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
            {itemsHeading}
          </h2>

          <ul className="mt-4 flex flex-col gap-3">
            {items.map((item) => (
              <li
                key={item.variant.variantId}
                className="flex items-baseline justify-between gap-4 border-b pb-3"
                style={{ borderColor: 'var(--line)' }}
              >
                <div>
                  <p className="text-body text-[var(--text)]">
                    {item.variant.productTitle} — {item.variant.variantName}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-dim)]">×{item.line.quantity}</p>
                  <RemoveFromCartButton variantId={item.variant.variantId} label={removeLabel} />
                </div>
                <span className="whitespace-nowrap font-mono text-base tabular-nums text-[var(--text)]">
                  {formatCents(cents(item.variant.priceCents * item.line.quantity))}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
                {subtotalLabel}
              </span>
              <span className="font-mono text-sm text-[var(--text)]">{formatCents(cents(subtotalCents))}</span>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
                {shippingLabel}
              </span>
              <span className="font-mono text-sm text-[var(--text)]">{shippingFreeLabel}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-4">
              <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
                {totalLabel}
              </span>
              <span className="font-serif text-2xl text-[var(--champagne)]">{formatCents(cents(subtotalCents))}</span>
            </div>
          </div>

          <p className="mt-3 text-sm text-[var(--text-dim)]">{shippingTaxNote}</p>
        </div>

        <div className="mt-10">
          <ShopCheckoutForm
            needsShipping={needsShipping}
            copy={{
              emailLabel, shippingHeading, recipientNameLabel, line1Label, line2Label, cityLabel, regionLabel,
              postalCodeLabel, countryLabel, consentLabel, submit, paymentHeading,
              paymentLabels: { secureBody, notConfigured, failed, declined, retry, processing, doNotClose, submit, working },
              errorGeneric, errorEmail, errorConsent, errorAddress, errorSoldOut, errorUnavailable, errorDeclined,
            }}
          />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
