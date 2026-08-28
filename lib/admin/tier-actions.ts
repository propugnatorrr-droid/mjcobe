'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { requireAdmin } from '@/lib/admin/guard';
import { recordAudit } from '@/lib/audit/log';
import {
  bool,
  parseAmountCents,
  str,
} from '@/lib/checkout/validate';

export type TierAdminState = {
  ok?: string;
  error?: string;
};

const BADGE_KEYS = new Set([
  'supporter',
  'day_one',
  'inner_circle',
  'gold',
  'founding',
  'executive',
]);

async function ipHash():
Promise<string | null> {
  const requestHeaders =
    await headers();

  const ip = requestHeaders
    .get('x-forwarded-for')
    ?.split(',')[0]
    ?.trim();

  return ip
    ? createHash('sha256')
        .update(ip)
        .digest('hex')
    : null;
}

function optionalInteger(
  value: FormDataEntryValue | null,
  minimum: number,
): {
  valid: boolean;
  value: number | null;
} {
  const input = str(value, 20);

  if (!input) {
    return {
      valid: true,
      value: null,
    };
  }

  const parsed = Number(input);

  if (
    !Number.isInteger(parsed) ||
    parsed < minimum
  ) {
    return {
      valid: false,
      value: null,
    };
  }

  return {
    valid: true,
    value: parsed,
  };
}

function optionalDate(
  value: FormDataEntryValue | null,
): {
  valid: boolean;
  value: Date | null;
} {
  const input = str(value, 40);

  if (!input) {
    return {
      valid: true,
      value: null,
    };
  }

  const parsed = new Date(input);

  if (
    Number.isNaN(parsed.getTime())
  ) {
    return {
      valid: false,
      value: null,
    };
  }

  return {
    valid: true,
    value: parsed,
  };
}

function benefitsFrom(
  value: FormDataEntryValue | null,
): string[] {
  const input = str(value, 4000);

  if (!input) {
    return [];
  }

  return input
    .split('\n')
    .map((benefit) => benefit.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((benefit) =>
      benefit.slice(0, 240),
    );
}

function badgeFrom(
  value: FormDataEntryValue | null,
): string | null {
  const badge = str(value, 40);

  return badge &&
    BADGE_KEYS.has(badge)
    ? badge
    : null;
}

async function campaignContext(
  campaignId: string,
) {
  const [row] = await db
    .select({
      campaignId: s.campaigns.id,
      songId: s.campaigns.songId,
      songSlug: s.songs.slug,
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

  return row ?? null;
}

function revalidateTierSurfaces(
  songId: string,
  songSlug: string,
) {
  revalidatePath(
    `/admin/songs/${songId}`,
  );
  revalidatePath(
    `/song/${songSlug}`,
  );
  revalidatePath('/back');
  revalidatePath('/music');
  revalidatePath('/', 'layout');
}

function readTierValues(
  formData: FormData,
) {
  const name = str(
    formData.get('name'),
    120,
  );

  const amountCents =
    parseAmountCents(
      formData.get('amount'),
    );

  const quantity =
    optionalInteger(
      formData.get('quantityLimit'),
      1,
    );

  const sort =
    optionalInteger(
      formData.get('sortIndex'),
      0,
    );

  const starts =
    optionalDate(
      formData.get('startsAt'),
    );

  const expires =
    optionalDate(
      formData.get('expiresAt'),
    );

  if (
    !name ||
    !amountCents ||
    !quantity.valid ||
    !sort.valid ||
    !starts.valid ||
    !expires.valid
  ) {
    return null;
  }

  if (
    starts.value &&
    expires.value &&
    expires.value <= starts.value
  ) {
    return null;
  }

  return {
    name,
    amountCents,
    description: str(
      formData.get('description'),
      1000,
    ),
    benefits: benefitsFrom(
      formData.get('benefits'),
    ),
    badgeKey: badgeFrom(
      formData.get('badgeKey'),
    ),
    quantityLimit: quantity.value,
    startsAt: starts.value,
    expiresAt: expires.value,
    sortIndex: sort.value ?? 0,
    isActive: bool(
      formData.get('isActive'),
    ),
  };
}

export async function createSupportTier(
  _previous: TierAdminState,
  formData: FormData,
): Promise<TierAdminState> {
  const me = await requireAdmin();

  const campaignId = str(
    formData.get('campaignId'),
  );

  const values =
    readTierValues(formData);

  if (!campaignId || !values) {
    return { error: 'invalid' };
  }

  const context =
    await campaignContext(campaignId);

  if (!context) {
    return { error: 'missing' };
  }

  const [created] = await dbw
    .insert(s.supportTiers)
    .values({
      campaignId,
      ...values,
    })
    .returning({
      id: s.supportTiers.id,
    });

  await recordAudit({
    adminUserId: me.id,
    action: 'support_tier.create',
    entity: 'support_tier',
    entityId: created.id,
    after: {
      campaignId,
      ...values,
    },
    ipHash: await ipHash(),
  });

  revalidateTierSurfaces(
    context.songId,
    context.songSlug,
  );

  return { ok: 'saved' };
}

export async function updateSupportTier(
  _previous: TierAdminState,
  formData: FormData,
): Promise<TierAdminState> {
  const me = await requireAdmin();

  const tierId = str(
    formData.get('tierId'),
  );

  const values =
    readTierValues(formData);

  if (!tierId || !values) {
    return { error: 'invalid' };
  }

  const [before] = await db
    .select()
    .from(s.supportTiers)
    .where(
      eq(
        s.supportTiers.id,
        tierId,
      ),
    )
    .limit(1);

  if (!before) {
    return { error: 'missing' };
  }

  const context =
    await campaignContext(
      before.campaignId,
    );

  if (!context) {
    return { error: 'missing' };
  }

  await dbw
    .update(s.supportTiers)
    .set(values)
    .where(
      eq(
        s.supportTiers.id,
        tierId,
      ),
    );

  await recordAudit({
    adminUserId: me.id,
    action: 'support_tier.update',
    entity: 'support_tier',
    entityId: tierId,
    before: {
      name: before.name,
      amountCents:
        before.amountCents,
      description:
        before.description,
      benefits: before.benefits,
      badgeKey: before.badgeKey,
      quantityLimit:
        before.quantityLimit,
      startsAt: before.startsAt,
      expiresAt: before.expiresAt,
      sortIndex: before.sortIndex,
      isActive: before.isActive,
    },
    after: values,
    ipHash: await ipHash(),
  });

  revalidateTierSurfaces(
    context.songId,
    context.songSlug,
  );

  return { ok: 'saved' };
}

export async function setSupportTierActive(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();

  const tierId = str(
    formData.get('tierId'),
  );

  const action = str(
    formData.get('action'),
  );

  if (
    !tierId ||
    (action !== 'activate' &&
      action !== 'deactivate')
  ) {
    return;
  }

  const [before] = await db
    .select()
    .from(s.supportTiers)
    .where(
      eq(
        s.supportTiers.id,
        tierId,
      ),
    )
    .limit(1);

  if (!before) {
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
    before.isActive === isActive
  ) {
    return;
  }

  await dbw
    .update(s.supportTiers)
    .set({ isActive })
    .where(
      eq(
        s.supportTiers.id,
        tierId,
      ),
    );

  await recordAudit({
    adminUserId: me.id,
    action:
      `support_tier.${action}`,
    entity: 'support_tier',
    entityId: tierId,
    before: {
      isActive: before.isActive,
    },
    after: {
      isActive,
    },
    ipHash: await ipHash(),
  });

  revalidateTierSurfaces(
    context.songId,
    context.songSlug,
  );
}
