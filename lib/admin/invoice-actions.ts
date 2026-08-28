'use server';

import {
  createHash,
} from 'node:crypto';
import {
  headers,
} from 'next/headers';
import {
  revalidatePath,
} from 'next/cache';
import {
  and,
  eq,
} from 'drizzle-orm';
import {
  db,
} from '@/lib/db/client';
import {
  dbw,
} from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import {
  requireAdmin,
} from '@/lib/admin/guard';
import {
  recordAudit,
} from '@/lib/audit/log';
import {
  parseAmountCents,
  str,
} from '@/lib/checkout/validate';

const INVOICE_STATUSES = [
  'draft',
  'issued',
  'paid',
  'void',
] as const;

type InvoiceStatus =
  (typeof INVOICE_STATUSES)[number];

export type InvoiceAdminState = {
  ok?: string;
  error?: string;
};

async function requestIpHash():
Promise<string | null> {
  const requestHeaders =
    await headers();

  const forwarded =
    requestHeaders.get(
      'x-forwarded-for',
    );

  const ip = forwarded
    ?.split(',')[0]
    ?.trim();

  return ip
    ? createHash('sha256')
        .update(ip)
        .digest('hex')
    : null;
}

function isInvoiceStatus(
  value: string | null,
): value is InvoiceStatus {
  return Boolean(
    value &&
      INVOICE_STATUSES.includes(
        value as InvoiceStatus,
      ),
  );
}

function invoiceNumberFrom(
  value:
    FormDataEntryValue | null,
): number | null {
  const input = str(
    value,
    20,
  );

  if (!input) {
    return null;
  }

  const number = Number(input);

  if (
    !Number.isSafeInteger(
      number,
    ) ||
    number <= 0
  ) {
    return null;
  }

  return number;
}

function documentPathFrom(
  value:
    FormDataEntryValue | null,
): string | null | undefined {
  const input = str(
    value,
    1000,
  );

  if (!input) {
    return null;
  }

  if (
    input.startsWith('/') &&
    !input.startsWith('//') &&
    !input.includes('\\')
  ) {
    return input;
  }

  try {
    const url = new URL(input);

    if (
      url.protocol !== 'https:'
    ) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

function issuedAtFrom(
  value:
    FormDataEntryValue | null,
): Date | null | undefined {
  const input = str(
    value,
    40,
  );

  if (!input) {
    return null;
  }

  const normalized =
    input.endsWith('Z')
      ? input
      : input.length === 16
        ? `${input}:00Z`
        : `${input}Z`;

  const date = new Date(
    normalized,
  );

  return Number.isNaN(
    date.getTime(),
  )
    ? undefined
    : date;
}

async function sponsorExists(
  sponsorId: string,
): Promise<boolean> {
  const [sponsor] = await db
    .select({
      id: s.sponsors.id,
    })
    .from(s.sponsors)
    .where(
      eq(
        s.sponsors.id,
        sponsorId,
      ),
    )
    .limit(1);

  return Boolean(sponsor);
}

async function contributionBelongsToSponsor(
  contributionId: string | null,
  sponsorId: string,
): Promise<boolean> {
  if (!contributionId) {
    return true;
  }

  const [contribution] =
    await db
      .select({
        id:
          s.contributions.id,
      })
      .from(s.contributions)
      .where(
        and(
          eq(
            s.contributions.id,
            contributionId,
          ),
          eq(
            s.contributions.sponsorId,
            sponsorId,
          ),
          eq(
            s.contributions.supportType,
            'business',
          ),
        ),
      )
      .limit(1);

  return Boolean(contribution);
}

function revalidateInvoicePages(
  sponsorId: string,
): void {
  revalidatePath(
    `/admin/sponsors/${sponsorId}`,
  );

  revalidatePath(
    '/admin/sponsors/manage',
  );

  revalidatePath(
    '/admin/contributions',
  );

  revalidatePath(
    '/admin/audit',
  );
}

function isUniqueViolation(
  error: unknown,
): boolean {
  if (
    !error ||
    typeof error !== 'object'
  ) {
    return false;
  }

  const directCode =
    'code' in error
      ? String(error.code)
      : null;

  if (directCode === '23505') {
    return true;
  }

  if (
    'cause' in error &&
    error.cause &&
    typeof error.cause ===
      'object' &&
    'code' in error.cause
  ) {
    return String(
      error.cause.code,
    ) === '23505';
  }

  return false;
}

function auditActionForStatus(
  previousStatus:
    InvoiceStatus | null,
  nextStatus:
    InvoiceStatus,
): string {
  if (
    previousStatus ===
      nextStatus
  ) {
    return 'sponsor_invoice.update';
  }

  if (
    nextStatus === 'issued'
  ) {
    return 'sponsor_invoice.issue';
  }

  if (
    nextStatus === 'paid'
  ) {
    return 'sponsor_invoice.mark_paid';
  }

  if (
    nextStatus === 'void'
  ) {
    return 'sponsor_invoice.void';
  }

  return 'sponsor_invoice.update';
}

export async function createInvoice(
  _previous:
    InvoiceAdminState,
  formData: FormData,
): Promise<InvoiceAdminState> {
  const me = await requireAdmin();

  const sponsorId = str(
    formData.get('sponsorId'),
    80,
  );

  const contributionId = str(
    formData.get(
      'contributionId',
    ),
    80,
  );

  const number =
    invoiceNumberFrom(
      formData.get('number'),
    );

  const amountCents =
    parseAmountCents(
      formData.get('amount'),
    );

  const statusValue = str(
    formData.get('status'),
    20,
  );

  const pdfPath =
    documentPathFrom(
      formData.get('pdfPath'),
    );

  const issuedAt =
    issuedAtFrom(
      formData.get('issuedAt'),
    );

  if (
    !sponsorId ||
    number === null ||
    amountCents === null ||
    !isInvoiceStatus(
      statusValue,
    ) ||
    pdfPath === undefined ||
    issuedAt === undefined
  ) {
    return {
      error: 'invalid',
    };
  }

  if (
    (
      statusValue === 'issued' ||
      statusValue === 'paid'
    ) &&
    !issuedAt
  ) {
    return {
      error: 'invalid',
    };
  }

  if (
    !(await sponsorExists(
      sponsorId,
    )) ||
    !(await contributionBelongsToSponsor(
      contributionId,
      sponsorId,
    ))
  ) {
    return {
      error: 'missing',
    };
  }

  let created:
    typeof s.invoices.$inferSelect |
    undefined;

  try {
    [created] = await dbw
      .insert(s.invoices)
      .values({
        sponsorId,
        contributionId,
        number,
        amountCents,
        status: statusValue,
        pdfPath,
        issuedAt,
      })
      .returning();
  } catch (error) {
    if (
      isUniqueViolation(error)
    ) {
      return {
        error: 'duplicate',
      };
    }

    console.error(
      'Failed to create invoice',
      error,
    );

    return {
      error: 'failed',
    };
  }

  if (!created) {
    return {
      error: 'failed',
    };
  }

  await recordAudit({
    adminUserId: me.id,
    action:
      'sponsor_invoice.create',
    entity:
      'sponsor_invoice',
    entityId: created.id,
    after: created,
    ipHash:
      await requestIpHash(),
  });

  revalidateInvoicePages(
    sponsorId,
  );

  return {
    ok: 'saved',
  };
}

export async function updateInvoice(
  _previous:
    InvoiceAdminState,
  formData: FormData,
): Promise<InvoiceAdminState> {
  const me = await requireAdmin();

  const invoiceId = str(
    formData.get('invoiceId'),
    80,
  );

  const sponsorId = str(
    formData.get('sponsorId'),
    80,
  );

  const contributionId = str(
    formData.get(
      'contributionId',
    ),
    80,
  );

  const number =
    invoiceNumberFrom(
      formData.get('number'),
    );

  const amountCents =
    parseAmountCents(
      formData.get('amount'),
    );

  const statusValue = str(
    formData.get('status'),
    20,
  );

  const pdfPath =
    documentPathFrom(
      formData.get('pdfPath'),
    );

  const issuedAt =
    issuedAtFrom(
      formData.get('issuedAt'),
    );

  if (
    !invoiceId ||
    !sponsorId ||
    number === null ||
    amountCents === null ||
    !isInvoiceStatus(
      statusValue,
    ) ||
    pdfPath === undefined ||
    issuedAt === undefined
  ) {
    return {
      error: 'invalid',
    };
  }

  if (
    (
      statusValue === 'issued' ||
      statusValue === 'paid'
    ) &&
    !issuedAt
  ) {
    return {
      error: 'invalid',
    };
  }

  const [before] = await db
    .select()
    .from(s.invoices)
    .where(
      eq(
        s.invoices.id,
        invoiceId,
      ),
    )
    .limit(1);

  if (
    !before ||
    before.sponsorId !==
      sponsorId ||
    !(await sponsorExists(
      sponsorId,
    )) ||
    !(await contributionBelongsToSponsor(
      contributionId,
      sponsorId,
    ))
  ) {
    return {
      error: 'missing',
    };
  }

  let after:
    typeof s.invoices.$inferSelect |
    undefined;

  try {
    [after] = await dbw
      .update(s.invoices)
      .set({
        contributionId,
        number,
        amountCents,
        status: statusValue,
        pdfPath,
        issuedAt,
      })
      .where(
        eq(
          s.invoices.id,
          invoiceId,
        ),
      )
      .returning();
  } catch (error) {
    if (
      isUniqueViolation(error)
    ) {
      return {
        error: 'duplicate',
      };
    }

    console.error(
      'Failed to update invoice',
      error,
    );

    return {
      error: 'failed',
    };
  }

  if (!after) {
    return {
      error: 'failed',
    };
  }

  await recordAudit({
    adminUserId: me.id,
    action:
      auditActionForStatus(
        before.status,
        statusValue,
      ),
    entity:
      'sponsor_invoice',
    entityId: invoiceId,
    before,
    after,
    ipHash:
      await requestIpHash(),
  });

  revalidateInvoicePages(
    sponsorId,
  );

  return {
    ok: 'saved',
  };
}
