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
  slugify,
  str,
} from '@/lib/checkout/validate';

export type CampaignAdminState = {
  ok?: string;
  error?: string;
};

type CampaignStatus =
  typeof s.campaigns.$inferSelect.status;

type CampaignKind =
  typeof s.campaigns.$inferSelect.kind;

const CAMPAIGN_STATUSES =
  new Set<CampaignStatus>([
    'draft',
    'live',
    'funded',
    'closed',
    'archived',
  ]);

const CAMPAIGN_KINDS =
  new Set<CampaignKind>([
    'release',
    'video',
    'remix',
    'tour',
    'other',
  ]);

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

function campaignStatusFrom(
  value: FormDataEntryValue | null,
  fallback: CampaignStatus,
): CampaignStatus | null {
  const candidate =
    str(value, 30) ??
    fallback;

  return CAMPAIGN_STATUSES.has(
    candidate as CampaignStatus,
  )
    ? candidate as CampaignStatus
    : null;
}

function campaignKindFrom(
  value: FormDataEntryValue | null,
): CampaignKind | null {
  const candidate =
    str(value, 30) ??
    'release';

  return CAMPAIGN_KINDS.has(
    candidate as CampaignKind,
  )
    ? candidate as CampaignKind
    : null;
}

function dateFrom(
  value: FormDataEntryValue | null,
): Date | null | undefined {
  const input = str(
    value,
    40,
  );

  if (!input) {
    return null;
  }

  const parsed = new Date(
    input.endsWith('Z')
      ? input
      : `${input}:00Z`,
  );

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return undefined;
  }

  return parsed;
}

function datesFrom(
  formData: FormData,
):
  | {
      startsAt: Date | null;
      endsAt: Date | null;
    }
  | null {
  const startsAt = dateFrom(
    formData.get('startsAt'),
  );

  const endsAt = dateFrom(
    formData.get('endsAt'),
  );

  if (
    startsAt === undefined ||
    endsAt === undefined
  ) {
    return null;
  }

  if (
    startsAt &&
    endsAt &&
    endsAt.getTime() <=
      startsAt.getTime()
  ) {
    return null;
  }

  return {
    startsAt,
    endsAt,
  };
}

async function songContext(
  songId: string,
): Promise<{
  id: string;
  slug: string;
} | null> {
  const [song] = await db
    .select({
      id: s.songs.id,
      slug: s.songs.slug,
    })
    .from(s.songs)
    .where(
      eq(
        s.songs.id,
        songId,
      ),
    )
    .limit(1);

  return song ?? null;
}

function revalidateCampaignSurfaces(
  song: {
    id: string;
    slug: string;
  },
): void {
  revalidatePath(
    `/admin/songs/${song.id}`,
  );

  revalidatePath(
    `/song/${song.slug}`,
  );

  revalidatePath(
    `/song/${song.slug}/sponsor`,
  );

  revalidatePath('/back');
  revalidatePath('/music');
  revalidatePath('/partners');
  revalidatePath('/');
}

export async function createCampaign(
  _previous: CampaignAdminState,
  formData: FormData,
): Promise<CampaignAdminState> {
  const me = await requireAdmin();

  const songId = str(
    formData.get('songId'),
    80,
  );

  const name = str(
    formData.get('name'),
    200,
  );

  const goalCents =
    parseAmountCents(
      formData.get('goal'),
    );

  const status =
    campaignStatusFrom(
      formData.get('status'),
      'draft',
    );

  const kind =
    campaignKindFrom(
      formData.get('kind'),
    );

  const dates =
    datesFrom(formData);

  if (
    !songId ||
    !name ||
    goalCents === null ||
    goalCents <= 0 ||
    !status ||
    !kind ||
    !dates
  ) {
    return {
      error: 'invalid',
    };
  }

  const song =
    await songContext(songId);

  if (!song) {
    return {
      error: 'missing',
    };
  }

  const slug = [
    song.slug,
    slugify(name),
  ]
    .join('-')
    .slice(0, 80);

  const values = {
    songId,
    slug,
    name,
    goalCents,
    kind,
    status,
    objective: str(
      formData.get('objective'),
      500,
    ),
    startsAt: dates.startsAt,
    endsAt: dates.endsAt,
    acceptSupport: bool(
      formData.get(
        'acceptSupport',
      ),
    ),
    fanSupportEnabled: bool(
      formData.get(
        'fanSupportEnabled',
      ),
    ),
    businessSponsorshipEnabled:
      bool(
        formData.get(
          'businessSponsorshipEnabled',
        ),
      ),
  };

  const [created] = await dbw
    .insert(s.campaigns)
    .values(values)
    .returning();

  if (!created) {
    return {
      error: 'failed',
    };
  }

  await recordAudit({
    adminUserId: me.id,
    action: 'campaign.create',
    entity: 'campaign',
    entityId: created.id,
    after: created,
    ipHash:
      await requestIpHash(),
  });

  revalidateCampaignSurfaces(
    song,
  );

  return {
    ok: 'saved',
  };
}

export async function updateCampaign(
  _previous: CampaignAdminState,
  formData: FormData,
): Promise<CampaignAdminState> {
  const me = await requireAdmin();

  const id = str(
    formData.get('id'),
    80,
  );

  const songId = str(
    formData.get('songId'),
    80,
  );

  if (!id || !songId) {
    return {
      error: 'invalid',
    };
  }

  const [before] = await db
    .select()
    .from(s.campaigns)
    .where(
      eq(
        s.campaigns.id,
        id,
      ),
    )
    .limit(1);

  if (
    !before ||
    before.songId !== songId
  ) {
    return {
      error: 'missing',
    };
  }

  const name = str(
    formData.get('name'),
    200,
  );

  const goalCents =
    parseAmountCents(
      formData.get('goal'),
    );

  const status =
    campaignStatusFrom(
      formData.get('status'),
      before.status,
    );

  const dates =
    datesFrom(formData);

  if (
    !name ||
    goalCents === null ||
    goalCents <= 0 ||
    !status ||
    !dates
  ) {
    return {
      error: 'invalid',
    };
  }

  const song =
    await songContext(songId);

  if (!song) {
    return {
      error: 'missing',
    };
  }

  const patch = {
    name,
    goalCents,
    status,
    objective: str(
      formData.get('objective'),
      500,
    ),
    startsAt: dates.startsAt,
    endsAt: dates.endsAt,
    acceptSupport: bool(
      formData.get(
        'acceptSupport',
      ),
    ),
    fanSupportEnabled: bool(
      formData.get(
        'fanSupportEnabled',
      ),
    ),
    businessSponsorshipEnabled:
      bool(
        formData.get(
          'businessSponsorshipEnabled',
        ),
      ),
    updatedAt: new Date(),
  };

  const [after] = await dbw
    .update(s.campaigns)
    .set(patch)
    .where(
      eq(
        s.campaigns.id,
        id,
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
    action: 'campaign.update',
    entity: 'campaign',
    entityId: id,
    before,
    after,
    ipHash:
      await requestIpHash(),
  });

  revalidateCampaignSurfaces(
    song,
  );

  return {
    ok: 'saved',
  };
}

export async function setCampaignLifecycle(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();

  const campaignId = str(
    formData.get('campaignId'),
    80,
  );

  const action = str(
    formData.get('action'),
    20,
  );

  if (
    !campaignId ||
    (
      action !== 'launch' &&
      action !== 'pause' &&
      action !== 'resume' &&
      action !== 'close'
    )
  ) {
    return;
  }

  const [before] = await db
    .select()
    .from(s.campaigns)
    .where(
      eq(
        s.campaigns.id,
        campaignId,
      ),
    )
    .limit(1);

  if (!before) {
    return;
  }

  const song =
    await songContext(
      before.songId,
    );

  if (!song) {
    return;
  }

  const now = new Date();

  let patch:
    Partial<
      typeof s.campaigns.$inferInsert
    >;

  if (action === 'launch') {
    patch = {
      status: 'live',
      acceptSupport: true,
      startsAt:
        !before.startsAt ||
        before.startsAt.getTime() >
          now.getTime()
          ? now
          : before.startsAt,
      endsAt:
        before.endsAt &&
        before.endsAt.getTime() <=
          now.getTime()
          ? null
          : before.endsAt,
      updatedAt: now,
    };
  } else if (
    action === 'pause'
  ) {
    patch = {
      acceptSupport: false,
      updatedAt: now,
    };
  } else if (
    action === 'resume'
  ) {
    patch = {
      status: 'live',
      acceptSupport: true,
      updatedAt: now,
    };
  } else {
    patch = {
      status: 'closed',
      acceptSupport: false,
      endsAt:
        !before.endsAt ||
        before.endsAt.getTime() >
          now.getTime()
          ? now
          : before.endsAt,
      updatedAt: now,
    };
  }

  const [after] = await dbw
    .update(s.campaigns)
    .set(patch)
    .where(
      eq(
        s.campaigns.id,
        campaignId,
      ),
    )
    .returning();

  if (!after) {
    return;
  }

  await recordAudit({
    adminUserId: me.id,
    action:
      `campaign.${action}`,
    entity: 'campaign',
    entityId: campaignId,
    before,
    after,
    ipHash:
      await requestIpHash(),
  });

  revalidateCampaignSurfaces(
    song,
  );
}
