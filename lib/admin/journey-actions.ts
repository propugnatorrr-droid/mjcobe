'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  and,
  eq,
} from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { recordAudit } from '@/lib/audit/log';
import { requireAdmin } from '@/lib/admin/guard';
import {
  bool,
  str,
} from '@/lib/checkout/validate';
import {
  isJourneyEventKind,
} from '@/lib/journey/kinds';

type JourneyRelations = {
  songId: string | null;
  campaignId: string | null;
  mediaAssetId: string | null;
};

async function requestIpHash():
Promise<string | null> {
  const requestHeaders = await headers();
  const forwarded =
    requestHeaders.get('x-forwarded-for');
  const ip = forwarded
    ?.split(',')[0]
    ?.trim();

  return ip
    ? createHash('sha256')
        .update(ip)
        .digest('hex')
    : null;
}

function occurredAtFrom(
  value: FormDataEntryValue | null,
): Date | null {
  const input = str(value, 40);

  if (!input) {
    return null;
  }

  const date = new Date(input);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

async function resolveRelations(
  requestedSongId: string | null,
  campaignId: string | null,
  mediaAssetId: string | null,
): Promise<JourneyRelations | null> {
  let songId = requestedSongId;

  if (campaignId) {
    const [campaign] = await db
      .select({
        id: s.campaigns.id,
        songId: s.campaigns.songId,
      })
      .from(s.campaigns)
      .where(
        eq(
          s.campaigns.id,
          campaignId,
        ),
      )
      .limit(1);

    if (!campaign) {
      return null;
    }

    if (
      songId &&
      songId !== campaign.songId
    ) {
      return null;
    }

    songId = campaign.songId;
  }

  if (songId) {
    const [song] = await db
      .select({
        id: s.songs.id,
      })
      .from(s.songs)
      .where(eq(s.songs.id, songId))
      .limit(1);

    if (!song) {
      return null;
    }
  }

  if (mediaAssetId) {
    const [image] = await db
      .select({
        id: s.mediaAssets.id,
      })
      .from(s.mediaAssets)
      .where(
        and(
          eq(
            s.mediaAssets.id,
            mediaAssetId,
          ),
          eq(
            s.mediaAssets.kind,
            'image',
          ),
        ),
      )
      .limit(1);

    if (!image) {
      return null;
    }
  }

  return {
    songId,
    campaignId,
    mediaAssetId,
  };
}

async function songSlug(
  songId: string | null,
): Promise<string | null> {
  if (!songId) {
    return null;
  }

  const [song] = await db
    .select({
      slug: s.songs.slug,
    })
    .from(s.songs)
    .where(eq(s.songs.id, songId))
    .limit(1);

  return song?.slug ?? null;
}

async function revalidateJourneySurfaces(
  songIds: Array<string | null>,
): Promise<void> {
  revalidatePath('/admin/journey');
  revalidatePath('/journey');

  const uniqueIds = Array.from(
    new Set(
      songIds.filter(
        (id): id is string => Boolean(id),
      ),
    ),
  );

  const slugs = await Promise.all(
    uniqueIds.map(songSlug),
  );

  for (const slug of slugs) {
    if (slug) {
      revalidatePath(`/song/${slug}`);
    }
  }
}

export async function createJourneyEvent(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();

  const title = str(
    formData.get('title'),
    200,
  );
  const kind = str(
    formData.get('kind'),
    50,
  );
  const occurredAt = occurredAtFrom(
    formData.get('occurredAt'),
  );

  if (
    !title ||
    !isJourneyEventKind(kind) ||
    !occurredAt
  ) {
    return;
  }

  const relations = await resolveRelations(
    str(formData.get('songId')),
    str(formData.get('campaignId')),
    str(formData.get('mediaAssetId')),
  );

  if (!relations) {
    return;
  }

  const values = {
    ...relations,
    kind,
    title,
    body: str(
      formData.get('body'),
      2000,
    ),
    occurredAt,
    isAuto: false,
    isVisible: bool(
      formData.get('isVisible'),
    ),
  };

  const [created] = await dbw
    .insert(s.journeyEvents)
    .values(values)
    .returning({
      id: s.journeyEvents.id,
    });

  await recordAudit({
    adminUserId: me.id,
    action: 'journey_event.create',
    entity: 'journey_event',
    entityId: created.id,
    after: {
      ...values,
      occurredAt:
        occurredAt.toISOString(),
    },
    ipHash: await requestIpHash(),
  });

  await revalidateJourneySurfaces([
    relations.songId,
  ]);
}

export async function updateJourneyEvent(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();

  const eventId = str(
    formData.get('eventId'),
  );
  const title = str(
    formData.get('title'),
    200,
  );
  const kind = str(
    formData.get('kind'),
    50,
  );
  const occurredAt = occurredAtFrom(
    formData.get('occurredAt'),
  );

  if (
    !eventId ||
    !title ||
    !isJourneyEventKind(kind) ||
    !occurredAt
  ) {
    return;
  }

  const [before] = await db
    .select()
    .from(s.journeyEvents)
    .where(
      eq(
        s.journeyEvents.id,
        eventId,
      ),
    )
    .limit(1);

  if (!before) {
    return;
  }

  const relations = await resolveRelations(
    str(formData.get('songId')),
    str(formData.get('campaignId')),
    str(formData.get('mediaAssetId')),
  );

  if (!relations) {
    return;
  }

  const patch = {
    ...relations,
    kind,
    title,
    body: str(
      formData.get('body'),
      2000,
    ),
    occurredAt,
    isVisible: bool(
      formData.get('isVisible'),
    ),
  };

  await dbw
    .update(s.journeyEvents)
    .set(patch)
    .where(
      eq(
        s.journeyEvents.id,
        eventId,
      ),
    );

  await recordAudit({
    adminUserId: me.id,
    action: 'journey_event.update',
    entity: 'journey_event',
    entityId: eventId,
    before: {
      songId: before.songId,
      campaignId: before.campaignId,
      kind: before.kind,
      title: before.title,
      body: before.body,
      mediaAssetId:
        before.mediaAssetId,
      occurredAt:
        before.occurredAt.toISOString(),
      isVisible: before.isVisible,
    },
    after: {
      ...patch,
      occurredAt:
        occurredAt.toISOString(),
    },
    ipHash: await requestIpHash(),
  });

  await revalidateJourneySurfaces([
    before.songId,
    relations.songId,
  ]);
}

export async function setJourneyEventVisibility(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();

  const eventId = str(
    formData.get('eventId'),
  );
  const action = str(
    formData.get('action'),
  );

  if (
    !eventId ||
    (action !== 'show' &&
      action !== 'hide')
  ) {
    return;
  }

  const [before] = await db
    .select()
    .from(s.journeyEvents)
    .where(
      eq(
        s.journeyEvents.id,
        eventId,
      ),
    )
    .limit(1);

  if (!before) {
    return;
  }

  const isVisible = action === 'show';

  if (before.isVisible === isVisible) {
    return;
  }

  await dbw
    .update(s.journeyEvents)
    .set({ isVisible })
    .where(
      eq(
        s.journeyEvents.id,
        eventId,
      ),
    );

  await recordAudit({
    adminUserId: me.id,
    action:
      `journey_event.${action}`,
    entity: 'journey_event',
    entityId: eventId,
    before: {
      isVisible: before.isVisible,
    },
    after: {
      isVisible,
    },
    ipHash: await requestIpHash(),
  });

  await revalidateJourneySurfaces([
    before.songId,
  ]);
}
