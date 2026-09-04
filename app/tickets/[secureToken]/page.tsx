import type { Metadata } from 'next';
import QRCode from 'qrcode';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { getPublicTicketByCredential } from '@/lib/tickets/queries';
import { formatEventDateTime } from '@/lib/events/queries';
import { flagEnabled } from '@/lib/config/settings';
import { text } from '@/lib/copy/site-copy';
import type { CopyKey } from '@/lib/copy/defaults';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ secureToken: string }> };

/** Same reasoning as /orders/[secureToken]: public, unauthenticated, so
 * the lookup is gated behind ticketSalesEnabled rather than querying a
 * table that may not exist yet in an environment where that migration
 * hasn't been applied. */
async function ticketsAvailable(): Promise<boolean> {
  return flagEnabled('ticketSalesEnabled');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!(await ticketsAvailable())) {
    return { title: await text('tickets_page.not_found'), robots: { index: false, follow: false } };
  }
  const { secureToken } = await params;
  const ticket = await getPublicTicketByCredential(secureToken);
  return { title: ticket ? await text('tickets_page.title') : await text('tickets_page.not_found'), robots: { index: false, follow: false } };
}

const STATUS_COPY_KEYS: Record<string, CopyKey> = {
  valid: 'tickets_page.status_valid',
  checked_in: 'tickets_page.status_checked_in',
  void: 'tickets_page.status_void',
};

export default async function TicketPage({ params }: Props) {
  const { secureToken } = await params;
  const available = await ticketsAvailable();
  const ticket = available ? await getPublicTicketByCredential(secureToken) : null;

  const [title, notFoundBody] = await Promise.all([text('tickets_page.title'), text('tickets_page.not_found')]);

  if (!ticket) {
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

  const [statusLabel, displayCodeLabel, showAtDoor] = await Promise.all([
    text(STATUS_COPY_KEYS[ticket.status] ?? 'tickets_page.status_valid'),
    text('tickets_page.display_code'),
    text('tickets_page.show_at_door'),
  ]);

  const qrDataUrl = await QRCode.toDataURL(secureToken, { margin: 1, width: 320, color: { dark: '#0a0a0a', light: '#f5f0e7' } });

  return (
    <main id="main-content" className="surface-ink min-h-screen">
      <SiteNav sub={title} />

      <article className="site-shell section-space-compact">
        <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-[var(--champagne)]">
          {statusLabel}
        </p>

        <h1 className="mt-4 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none text-[var(--text)]">
          {ticket.eventTitle}
        </h1>

        <p className="mt-2 text-body text-[var(--text-dim)]">
          {formatEventDateTime(ticket.startsAt, ticket.timezone)} · {ticket.venueName}
        </p>

        {ticket.status === 'valid' ? (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-[var(--radius-panel)] border p-8" style={{ borderColor: 'var(--line)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="" width={240} height={240} className="h-60 w-60" />
            <p className="text-center text-sm text-[var(--text-dim)]">{showAtDoor}</p>
            <div className="text-center">
              <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
                {displayCodeLabel}
              </p>
              <p className="mt-1 font-mono text-2xl tracking-[0.2em] text-[var(--champagne)]">{ticket.displayCode}</p>
            </div>
          </div>
        ) : null}
      </article>

      <SiteFooter />
    </main>
  );
}
