import type { Metadata } from 'next';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { getOrderBySecureToken } from '@/lib/commerce/orders';
import { flagEnabled } from '@/lib/config/settings';
import { formatCents, cents } from '@/lib/money/cents';
import { text } from '@/lib/copy/site-copy';
import type { CopyKey } from '@/lib/copy/defaults';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ secureToken: string }> };

/**
 * `/orders/[secureToken]` is public and unauthenticated — unlike every
 * other new route in this initiative, it's reachable by anyone at any
 * time, not gated behind a login. `commerce_orders` is generated-but-
 * unapplied per this initiative's standing migration policy, so an
 * unconditional query here would 500 for any visitor whenever that
 * migration hasn't run yet — this crashed exactly that way during this
 * batch's own live verification. No real order can exist unless
 * `ticketSalesEnabled` (or, once Batch J ships, `shopEnabled`) was on at
 * checkout time, so gating the lookup on that flag is both the fix and
 * the semantically correct behavior, not just a workaround.
 */
async function commerceOrdersAvailable(): Promise<boolean> {
  return flagEnabled('ticketSalesEnabled');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!(await commerceOrdersAvailable())) {
    return { title: await text('orders.not_found'), robots: { index: false, follow: false } };
  }

  const { secureToken } = await params;
  const found = await getOrderBySecureToken(secureToken);
  return { title: found ? await text('orders.title') : await text('orders.not_found'), robots: { index: false, follow: false } };
}

const STATUS_COPY_KEYS: Record<string, CopyKey> = {
  pending: 'orders.status_pending',
  paid: 'orders.status_paid',
  failed: 'orders.status_failed',
  canceled: 'orders.status_canceled',
  refunded: 'orders.status_refunded',
  partially_refunded: 'orders.status_partially_refunded',
  disputed: 'orders.status_disputed',
};

export default async function OrderConfirmationPage({ params }: Props) {
  const { secureToken } = await params;
  const ordersAvailable = await commerceOrdersAvailable();
  const found = ordersAvailable ? await getOrderBySecureToken(secureToken) : null;

  const [title, notFoundBody] = await Promise.all([text('orders.title'), text('orders.not_found')]);

  if (!found) {
    return (
      <main id="main-content" className="surface-ink min-h-screen">
        <SiteNav sub={title} />
        <header className="site-shell section-space-compact">
          <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none text-[var(--text)]">
            {title}
          </h1>
          <p className="mt-4 max-w-[52ch] text-body text-[var(--text-dim)]">{notFoundBody}</p>
        </header>
        <SiteFooter />
      </main>
    );
  }

  const { order, items } = found;

  const [statusLabel, orderNumberLabel, totalLabel, itemsHeading, ticketNote] = await Promise.all([
    text(STATUS_COPY_KEYS[order.status] ?? 'orders.status_pending'),
    text('orders.order_number'),
    text('orders.total'),
    text('orders.items_heading'),
    order.orderType === 'ticket' ? text('orders.ticket_note') : Promise.resolve(null),
  ]);

  return (
    <main id="main-content" className="surface-ink min-h-screen">
      <SiteNav sub={title} />

      <article className="site-shell section-space-compact">
        <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-[var(--champagne)]">
          {statusLabel}
        </p>

        <h1 className="mt-4 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none text-[var(--text)]">
          {title}
        </h1>

        <p className="mt-4 font-mono text-sm text-[var(--text-dim)]">
          {orderNumberLabel}: {order.orderNumber}
        </p>

        <section aria-labelledby="order-items-heading" className="mt-8 max-w-[52ch]">
          <h2 id="order-items-heading" className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
            {itemsHeading}
          </h2>

          <ul className="mt-4 flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-4 border-b pb-3" style={{ borderColor: 'var(--line)' }}>
                <div>
                  <p className="text-body text-[var(--text)]">{item.titleSnapshot}</p>
                  <p className="mt-1 text-sm text-[var(--text-dim)]">×{item.quantity}</p>
                </div>
                <span className="whitespace-nowrap font-mono text-base tabular-nums text-[var(--text)]">
                  {formatCents(cents(item.lineTotalCents))}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-baseline justify-between gap-4">
            <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
              {totalLabel}
            </span>
            <span className="font-serif text-2xl text-[var(--champagne)]">{formatCents(cents(order.totalCents))}</span>
          </div>
        </section>

        {ticketNote ? <p className="mt-8 max-w-[52ch] text-sm text-[var(--text-dim)]">{ticketNote}</p> : null}
      </article>

      <SiteFooter />
    </main>
  );
}
