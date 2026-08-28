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
  str,
} from '@/lib/checkout/validate';

export type ContractAdminState = {
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

function signedAtFrom(
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

  const date = new Date(
    input.endsWith('Z')
      ? input
      : `${input}:00Z`,
  );

  return Number.isNaN(
    date.getTime(),
  )
    ? undefined
    : date;
}

async function validCampaign(
  campaignId: string | null,
): Promise<boolean> {
  if (!campaignId) {
    return true;
  }

  const [campaign] = await db
    .select({
      id: s.campaigns.id,
    })
    .from(s.campaigns)
    .where(
      eq(
        s.campaigns.id,
        campaignId,
      ),
    )
    .limit(1);

  return Boolean(campaign);
}

function revalidateContractPages(
  sponsorId: string,
): void {
  revalidatePath(
    `/admin/sponsors/${sponsorId}`,
  );

  revalidatePath(
    '/admin/sponsors/manage',
  );

  revalidatePath(
    '/admin/sponsors',
  );
}

export async function createContract(
  _previous:
    ContractAdminState,
  formData: FormData,
): Promise<ContractAdminState> {
  const me = await requireAdmin();

  const sponsorId = str(
    formData.get('sponsorId'),
    80,
  );

  const campaignId = str(
    formData.get('campaignId'),
    80,
  );

  const pdfPath =
    documentPathFrom(
      formData.get('pdfPath'),
    );

  const signedAt =
    signedAtFrom(
      formData.get('signedAt'),
    );

  if (
    !sponsorId ||
    pdfPath === undefined ||
    signedAt === undefined
  ) {
    return {
      error: 'invalid',
    };
  }

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

  if (
    !sponsor ||
    !(await validCampaign(
      campaignId,
    ))
  ) {
    return {
      error: 'missing',
    };
  }

  const [created] = await dbw
    .insert(s.contracts)
    .values({
      sponsorId,
      campaignId,
      pdfPath,
      signedAt,
    })
    .returning();

  if (!created) {
    return {
      error: 'failed',
    };
  }

  await recordAudit({
    adminUserId: me.id,
    action:
      'sponsor_contract.create',
    entity:
      'sponsor_contract',
    entityId: created.id,
    after: created,
    ipHash:
      await requestIpHash(),
  });

  revalidateContractPages(
    sponsorId,
  );

  return {
    ok: 'saved',
  };
}

export async function updateContract(
  _previous:
    ContractAdminState,
  formData: FormData,
): Promise<ContractAdminState> {
  const me = await requireAdmin();

  const contractId = str(
    formData.get('contractId'),
    80,
  );

  const sponsorId = str(
    formData.get('sponsorId'),
    80,
  );

  const campaignId = str(
    formData.get('campaignId'),
    80,
  );

  const pdfPath =
    documentPathFrom(
      formData.get('pdfPath'),
    );

  const signedAt =
    signedAtFrom(
      formData.get('signedAt'),
    );

  if (
    !contractId ||
    !sponsorId ||
    pdfPath === undefined ||
    signedAt === undefined
  ) {
    return {
      error: 'invalid',
    };
  }

  const [before] = await db
    .select()
    .from(s.contracts)
    .where(
      eq(
        s.contracts.id,
        contractId,
      ),
    )
    .limit(1);

  if (
    !before ||
    before.sponsorId !==
      sponsorId ||
    !(await validCampaign(
      campaignId,
    ))
  ) {
    return {
      error: 'missing',
    };
  }

  const patch = {
    campaignId,
    pdfPath,
    signedAt,
  };

  const [after] = await dbw
    .update(s.contracts)
    .set(patch)
    .where(
      eq(
        s.contracts.id,
        contractId,
      ),
    )
    .returning();

  if (!after) {
    return {
      error: 'failed',
    };
  }

  await recordAudit({
    adminUserId: me.id,
    action:
      signedAt &&
      !before.signedAt
        ? 'sponsor_contract.sign'
        : !signedAt &&
            before.signedAt
          ? 'sponsor_contract.mark_unsigned'
          : 'sponsor_contract.update',
    entity:
      'sponsor_contract',
    entityId: contractId,
    before,
    after,
    ipHash:
      await requestIpHash(),
  });

  revalidateContractPages(
    sponsorId,
  );

  return {
    ok: 'saved',
  };
}
