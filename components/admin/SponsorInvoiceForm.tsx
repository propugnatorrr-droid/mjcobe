'use client';

import {
  useActionState,
} from 'react';
import {
  createInvoice,
  updateInvoice,
  type InvoiceAdminState,
} from '@/lib/admin/invoice-actions';
import type {
  AdminInvoiceRow,
  InvoiceContributionOption,
} from '@/lib/admin/invoices';
import { admin } from '@/lib/copy/admin';
import {
  cents,
  formatCents,
} from '@/lib/money/cents';

const INVOICE_STATUSES = [
  'draft',
  'issued',
  'paid',
  'void',
] as const;

type Props = {
  sponsorId: string;
  contributions:
    InvoiceContributionOption[];
  nextInvoiceNumber: number;
  invoice?: AdminInvoiceRow;
};

const fieldClass = [
  'min-h-11 w-full',
  'rounded-[var(--radius-panel)]',
  'border border-[var(--line)]',
  'bg-[var(--field-bg)]',
  'px-3 py-2',
  'font-mono text-sm',
  'text-[var(--text)]',
  'focus:border-[var(--champagne)]',
  'focus:outline-none',
].join(' ');

function dateTimeValue(
  value:
    Date | null | undefined,
): string {
  if (!value) {
    return '';
  }

  return value
    .toISOString()
    .slice(0, 16);
}

function amountValue(
  amountCents:
    number | undefined,
): string {
  if (
    amountCents === undefined
  ) {
    return '';
  }

  return (
    amountCents / 100
  ).toFixed(2);
}

function Label({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
      {children}
    </span>
  );
}

function errorLabel(
  error: string,
): string {
  if (
    error === 'duplicate'
  ) {
    return admin.sponsors
      .invoiceDuplicate;
  }

  if (
    error === 'invalid'
  ) {
    return admin.sponsors
      .invoiceInvalid;
  }

  return admin.failed;
}

export function SponsorInvoiceForm({
  sponsorId,
  contributions,
  nextInvoiceNumber,
  invoice,
}: Props) {
  const action = invoice
    ? updateInvoice
    : createInvoice;

  const [
    state,
    formAction,
  ] = useActionState<
    InvoiceAdminState,
    FormData
  >(
    action,
    {},
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5"
    >
      <input
        type="hidden"
        name="sponsorId"
        value={sponsorId}
      />

      {invoice ? (
        <input
          type="hidden"
          name="invoiceId"
          value={invoice.id}
        />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <Label>
            {
              admin.sponsors
                .invoiceNumber
            }
          </Label>

          <input
            className={fieldClass}
            name="number"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={
              invoice?.number ??
              nextInvoiceNumber
            }
          />
        </label>

        <label className="flex flex-col gap-2">
          <Label>
            {
              admin.sponsors
                .invoiceAmount
            }
          </Label>

          <input
            className={fieldClass}
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            required
            defaultValue={
              amountValue(
                invoice?.amountCents,
              )
            }
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <Label>
          {
            admin.sponsors
              .invoiceContribution
          }
        </Label>

        <select
          className={fieldClass}
          name="contributionId"
          defaultValue={
            invoice
              ?.contributionId ??
            ''
          }
        >
          <option value="">
            {
              admin.sponsors
                .invoiceNoContribution
            }
          </option>

          {contributions.map(
            (contribution) => (
              <option
                key={
                  contribution.id
                }
                value={
                  contribution.id
                }
              >
                {
                  contribution.songTitle
                }{' — '}
                {
                  contribution.campaignName
                }{' — '}
                {formatCents(
                  cents(
                    contribution
                      .amountCents,
                  ),
                )}
              </option>
            ),
          )}
        </select>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <Label>
            {
              admin.sponsors
                .invoiceStatus
            }
          </Label>

          <select
            className={fieldClass}
            name="status"
            defaultValue={
              invoice?.status ??
              'draft'
            }
          >
            {INVOICE_STATUSES.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {
                    admin.sponsors
                      .invoiceStatuses[
                        status
                      ]
                  }
                </option>
              ),
            )}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <Label>
            {
              admin.sponsors
                .invoiceIssuedAt
            }
          </Label>

          <input
            className={fieldClass}
            name="issuedAt"
            type="datetime-local"
            defaultValue={
              dateTimeValue(
                invoice?.issuedAt,
              )
            }
          />
        </label>
      </div>

      <p className="-mt-3 text-xs leading-5 text-[var(--text-faint)]">
        {
          admin.sponsors
            .invoiceIssuedHint
        }
      </p>

      <label className="flex flex-col gap-2">
        <Label>
          {
            admin.sponsors
              .invoiceDocument
          }
        </Label>

        <input
          className={fieldClass}
          name="pdfPath"
          type="text"
          inputMode="url"
          maxLength={1000}
          defaultValue={
            invoice?.pdfPath ??
            ''
          }
          placeholder="https://"
        />
      </label>

      <p className="-mt-3 text-xs leading-5 text-[var(--text-faint)]">
        {
          admin.sponsors
            .invoiceDocumentHint
        }
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="bg-gold inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.15em] text-[var(--ink)] hover:brightness-110"
        >
          {invoice
            ? admin.sponsors
                .saveInvoice
            : admin.sponsors
                .createInvoice}
        </button>

        {state.ok ? (
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {admin.saved}
          </span>
        ) : null}

        {state.error ? (
          <span
            className="font-mono text-eyebrow uppercase"
            style={{
              color:
                'var(--ember)',
            }}
          >
            {errorLabel(
              state.error,
            )}
          </span>
        ) : null}
      </div>
    </form>
  );
}
