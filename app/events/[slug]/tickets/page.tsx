import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { TicketCheckoutForm } from '@/components/events/TicketCheckoutForm';
import { getPublicEvent } from '@/lib/events/queries';
import { flagEnabled } from '@/lib/config/settings';
import { text } from '@/lib/copy/site-copy';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!(await flagEnabled('eventsEnabled')) || !(await flagEnabled('ticketSalesEnabled'))) {
    return { title: await text('notfound.title') };
  }
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  return { title: event ? await text('tickets_checkout.title') : await text('events.not_found') };
}

export default async function TicketCheckoutPage({ params }: Props) {
  if (!(await flagEnabled('eventsEnabled')) || !(await flagEnabled('ticketSalesEnabled'))) {
    notFound();
  }

  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) {
    notFound();
  }

  const [title, unavailableTitle, unavailableBody] = await Promise.all([
    text('tickets_checkout.title'),
    text('tickets_checkout.unavailable_title'),
    text('tickets_checkout.unavailable_body'),
  ]);

  if (event.ctaState !== 'on_sale' || event.ticketTypes.length === 0) {
    return (
      <main id="main-content" className="surface-ink min-h-screen">
        <SiteNav sub={title} />
        <header className="site-shell section-space-compact">
          <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none text-[var(--text)]">
            {unavailableTitle}
          </h1>
          <p className="mt-4 max-w-[52ch] text-body text-[var(--text-dim)]">{unavailableBody}</p>
          <Link
            href={`/events/${event.slug}`}
            className="mt-6 inline-flex font-ui text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--champagne)] hover:opacity-80"
          >
            {event.title}
          </Link>
        </header>
        <SiteFooter />
      </main>
    );
  }

  const [
    ticketTypeLabel, quantityLabel, emailLabel, consentLabel, submit, paymentHeading,
    secureBody, notConfigured, failed, declined, retry, processing, doNotClose, working,
    errorGeneric, errorEmail, errorConsent, errorQuantity, errorLimit, errorSoldOut,
    errorUnavailable, errorDeclined,
  ] = await Promise.all([
    text('tickets_checkout.ticket_type'), text('tickets_checkout.quantity'), text('tickets_checkout.email'),
    text('tickets_checkout.consent'), text('tickets_checkout.submit'), text('tickets_checkout.payment_heading'),
    text('tickets_checkout.secure_body'), text('tickets_checkout.not_configured'), text('tickets_checkout.failed'),
    text('tickets_checkout.declined'), text('tickets_checkout.retry'), text('tickets_checkout.processing'),
    text('tickets_checkout.do_not_close'), text('tickets_checkout.working'), text('tickets_checkout.error_generic'),
    text('tickets_checkout.error_email'), text('tickets_checkout.error_consent'), text('tickets_checkout.error_quantity'),
    text('tickets_checkout.error_limit'), text('tickets_checkout.error_sold_out'), text('tickets_checkout.error_unavailable'),
    text('tickets_checkout.error_declined'),
  ]);

  return (
    <main id="main-content" className="surface-ink min-h-screen">
      <SiteNav sub={title} />

      <header className="site-shell section-space-compact">
        <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none text-[var(--text)]">
          {title}
        </h1>
        <p className="mt-4 text-body text-[var(--text-dim)]">{event.title}</p>
      </header>

      <section className="site-shell section-space-compact pt-0">
        <TicketCheckoutForm
          event={event}
          copy={{
            ticketTypeLabel, quantityLabel, emailLabel, consentLabel, submit, paymentHeading,
            paymentLabels: { secureBody, notConfigured, failed, declined, retry, processing, doNotClose, submit, working },
            errorGeneric, errorEmail, errorConsent, errorQuantity, errorLimit, errorSoldOut,
            errorUnavailable, errorDeclined,
          }}
        />
      </section>

      <SiteFooter />
    </main>
  );
}
