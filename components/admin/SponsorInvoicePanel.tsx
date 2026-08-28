import {
  ExternalLink,
  FileText,
} from 'lucide-react';
import type {
  AdminInvoiceRow,
  InvoiceContributionOption,
} from '@/lib/admin/invoices';
import { admin } from '@/lib/copy/admin';
import {
  cents,
  formatCents,
} from '@/lib/money/cents';
import {
  SponsorInvoiceForm,
} from './SponsorInvoiceForm';

type Props = {
  sponsorId: string;
  invoices:
    AdminInvoiceRow[];
  contributions:
    InvoiceContributionOption[];
  nextInvoiceNumber: number;
};

function formatDate(
  value: Date,
): string {
  return value.toLocaleString(
    'en-US',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    },
  );
}

function invoiceNumber(
  value: number,
): string {
  return String(value)
    .padStart(6, '0');
}

function statusColor(
  status:
    AdminInvoiceRow['status'],
): string {
  if (status === 'paid') {
    return 'var(--champagne)';
  }

  if (status === 'issued') {
    return 'var(--text)';
  }

  if (status === 'void') {
    return 'var(--status-danger)';
  }

  return 'var(--text-dim)';
}

export function SponsorInvoicePanel({
  sponsorId,
  invoices,
  contributions,
  nextInvoiceNumber,
}: Props) {
  return (
    <section className="mt-10 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--ink-2)] p-6">
      <h2 className="font-mono text-eyebrow uppercase tracking-[0.14em] text-[var(--text)]">
        {
          admin.sponsors
            .invoices
        }
      </h2>

      <p className="mt-3 max-w-[62ch] text-body text-[var(--text-dim)]">
        {
          admin.sponsors
            .invoicesHint
        }
      </p>

      {invoices.length === 0 ? (
        <p className="mt-6 text-body text-[var(--text-dim)]">
          {
            admin.sponsors
              .invoicesEmpty
          }
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {invoices.map(
            (invoice) => (
              <details
                key={invoice.id}
                className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--ink)]"
              >
                <summary className="cursor-pointer list-none p-5">
                  <div className="flex flex-wrap items-center justify-between gap-5">
                    <div className="flex items-center gap-3">
                      <FileText
                        aria-hidden
                        size={18}
                        style={{
                          color:
                            statusColor(
                              invoice.status,
                            ),
                        }}
                      />

                      <div>
                        <p className="font-mono text-sm uppercase text-[var(--text)]">
                          INVOICE #
                          {invoiceNumber(
                            invoice.number,
                          )}
                        </p>

                        {invoice.songTitle ||
                        invoice.campaignName ? (
                          <p className="mt-1 text-xs text-[var(--text-dim)]">
                            {invoice.songTitle}
                            {invoice.songTitle &&
                            invoice.campaignName
                              ? ' — '
                              : ''}
                            {
                              invoice.campaignName
                            }
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-5">
                      <span className="numeric font-serif text-xl text-[var(--text)]">
                        {formatCents(
                          cents(
                            invoice.amountCents,
                          ),
                        )}
                      </span>

                      <span
                        className="font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.16em]"
                        style={{
                          color:
                            statusColor(
                              invoice.status,
                            ),
                        }}
                      >
                        {
                          admin.sponsors
                            .invoiceStatuses[
                              invoice.status
                            ]
                        }
                      </span>
                    </div>
                  </div>
                </summary>

                <div className="border-t border-[var(--line)] p-5">
                  <dl className="mb-6 grid gap-5 sm:grid-cols-2">
                    <div>
                      <dt className="font-ui text-[0.5625rem] uppercase tracking-[0.16em] text-[var(--text-faint)]">
                        {
                          admin.sponsors
                            .invoiceCreated
                        }
                      </dt>

                      <dd className="mt-1 text-sm text-[var(--text)]">
                        {formatDate(
                          invoice.createdAt,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-ui text-[0.5625rem] uppercase tracking-[0.16em] text-[var(--text-faint)]">
                        {
                          admin.sponsors
                            .invoiceIssuedAt
                        }
                      </dt>

                      <dd className="mt-1 text-sm text-[var(--text)]">
                        {invoice.issuedAt
                          ? formatDate(
                              invoice.issuedAt,
                            )
                          : '—'}
                      </dd>
                    </div>
                  </dl>

                  {invoice.pdfPath ? (
                    <a
                      href={
                        invoice.pdfPath
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mb-6 inline-flex items-center gap-2 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.15em] text-[var(--champagne)]"
                    >
                      {
                        admin.sponsors
                          .openInvoice
                      }

                      <ExternalLink
                        aria-hidden
                        size={14}
                      />
                    </a>
                  ) : null}

                  <SponsorInvoiceForm
                    sponsorId={
                      sponsorId
                    }
                    contributions={
                      contributions
                    }
                    nextInvoiceNumber={
                      nextInvoiceNumber
                    }
                    invoice={invoice}
                  />
                </div>
              </details>
            ),
          )}
        </div>
      )}

      <details className="mt-6 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--ink)]">
        <summary className="cursor-pointer p-5 font-mono text-eyebrow uppercase text-[var(--champagne)]">
          + {
            admin.sponsors
              .newInvoice
          }
        </summary>

        <div className="border-t border-[var(--line)] p-5">
          <SponsorInvoiceForm
            sponsorId={sponsorId}
            contributions={
              contributions
            }
            nextInvoiceNumber={
              nextInvoiceNumber
            }
          />
        </div>
      </details>
    </section>
  );
}
