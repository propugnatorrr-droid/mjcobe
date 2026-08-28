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
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import {
  requireAdmin,
} from '@/lib/admin/guard';
import {
  recordAudit,
} from '@/lib/audit/log';
import {
  bool,
  parseAmountCents,
  str,
} from '@/lib/checkout/validate';

export type SponsorPackageAdminState = {
  ok?: string;
  error?: string;
};

type CampaignContext = {
  campaignId: string;
  songId: string;
  songSlug: string;
};

type PackageValues = {
  name: string;
  priceCents: number;
  deliverables: string[];
  includesBrandedVisual: boolean;
  sortIndex: number;
  isActive: boolean;
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

function deliverablesFrom(
  value: FormDataEntryValue | null,
): string[] {
  const input = str(
    value,
    5000,
  );

  if (!input) {
    return [];
  }

  return input
    .split('\n')
    .map(
      (deliverable) =>
        deliverable.trim(),
    )
    .filter(Boolean)
    .slice(0, 30)
    .map(
      (deliverable) =>
        deliverable.slice(
          0,
          240,
        ),
    );
}

function sortIndexFrom(
  value: FormDataEntryValue | null,
): number | null {
  const input = str(
    value,
    20,
  );

  if (!input) {
    return 0;
  }

  const parsed =
    Number(input);

  if (
    !Number.isInteger(parsed) ||
    parsed < 0
  ) {
    return null;
  }

  return parsed;
}

function valuesFrom(
  formData: FormData,
): PackageValues | null {
  const name = str(
    formData.get('name'),
    120,
  );

  const priceCents =
    parseAmountCents(
      formData.get('price'),
    );

  const sortIndex =
    sortIndexFrom(
      formData.get(
        'sortIndex',
      ),
    );

  if (
    !name ||
    priceCents === null ||
    sortIndex === null
  ) {
    return null;
  }

  return {
    name,
    priceCents,
    deliverables:
      deliverablesFrom(
        formData.get(
          'deliverables',
        ),
      ),
    includesBrandedVisual:
      bool(
        formData.get(
          'includesBrandedVisual',
        ),
      ),
    sortIndex,
    isActive: bool(
      formData.get(
        'isActive',
      ),
    ),
  };
}

async function campaignContext(
  campaignId: string,
): Promise<CampaignContext | null> {
  const [context] = await db
    .select({
      campaignId:
        s.campaigns.id,
      songId:
        s.campaigns.songId,
      songSlug:
        s.songs.slug,
    })
    .from(s.campaigns)
    .innerJoin(
      s.songs,
      eq(
        s.songs.id,
        s.campaigns.songId,
      ),
    )
    .where(
      eq(
        s.campaigns.id,
        campaignId,
      ),
    )
    .limit(1);

  return context ?? null;
}

function revalidatePackageSurfaces(
  context: CampaignContext,
): void {
  revalidatePath(
    `/admin/songs/${context.songId}`,
  );

  revalidatePath(
    `/song/${context.songSlug}`,
  );

  revalidatePath(
    `/song/${context.songSlug}/sponsor`,
  );
}

export async function createSponsorPackage(
  _previous:
    SponsorPackageAdminState,
  formData: FormData,
): Promise<SponsorPackageAdminState> {
  const me = await requireAdmin();

  const campaignId = str(
    formData.get('campaignId'),
    80,
  );

  const values =
    valuesFrom(formData);

  if (
    !campaignId ||
    !values
  ) {
    return {
      error: 'invalid',
    };
  }

  const context =
    await campaignContext(
      campaignId,
    );

  if (!context) {
    return {
      error: 'missing',
    };
  }

  const [created] = await dbw
    .insert(
      s.sponsorPackages,
    )
    .values({
      campaignId,
      ...values,
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
      'sponsor_package.create',
    entity: 'sponsor_package',
    entityId: created.id,
    after: created,
    ipHash:
      await requestIpHash(),
  });

  revalidatePackageSurfaces(
    context,
  );

  return {
    ok: 'saved',
  };
}

export async function updateSponsorPackage(
  _previous:
    SponsorPackageAdminState,
  formData: FormData,
): Promise<SponsorPackageAdminState> {
  const me = await requireAdmin();

  const packageId = str(
    formData.get('packageId'),
    80,
  );

  const values =
    valuesFrom(formData);

  if (
    !packageId ||
    !values
  ) {
    return {
      error: 'invalid',
    };
  }

  const [before] = await db
    .select()
    .from(s.sponsorPackages)
    .where(
      eq(
        s.sponsorPackages.id,
        packageId,
      ),
    )
    .limit(1);

  if (
    !before ||
    !before.campaignId
  ) {
    return {
      error: 'missing',
    };
  }

  const context =
    await campaignContext(
      before.campaignId,
    );

  if (!context) {
    return {
      error: 'missing',
    };
  }

  const [after] = await dbw
    .update(
      s.sponsorPackages,
    )
    .set(values)
    .where(
      eq(
        s.sponsorPackages.id,
        packageId,
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
      'sponsor_package.update',
    entity: 'sponsor_package',
    entityId: packageId,
    before,
    after,
    ipHash:
      await requestIpHash(),
  });

  revalidatePackageSurfaces(
    context,
  );

  return {
    ok: 'saved',
  };
}

export async function setSponsorPackageActive(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();

  const packageId = str(
    formData.get('packageId'),
    80,
  );

  const action = str(
    formData.get('action'),
    20,
  );

  if (
    !packageId ||
    (
      action !== 'activate' &&
      action !== 'deactivate'
    )
  ) {
    return;
  }

  const [before] = await db
    .select()
    .from(s.sponsorPackages)
    .where(
      eq(
        s.sponsorPackages.id,
        packageId,
      ),
    )
    .limit(1);

  if (
    !before ||
    !before.campaignId
  ) {
    return;
  }

  const context =
    await campaignContext(
      before.campaignId,
    );

  if (!context) {
    return;
  }

  const isActive =
    action === 'activate';

  if (
    before.isActive ===
    isActive
  ) {
    return;
  }

  await dbw
    .update(
      s.sponsorPackages,
    )
    .set({
      isActive,
    })
    .where(
      eq(
        s.sponsorPackages.id,
        packageId,
      ),
    );

  await recordAudit({
    adminUserId: me.id,
    action:
      `sponsor_package.${action}`,
    entity: 'sponsor_package',
    entityId: packageId,
    before: {
      isActive:
        before.isActive,
    },
    after: {
      isActive,
    },
    ipHash:
      await requestIpHash(),
  });

  revalidatePackageSurfaces(
    context,
  );
}
