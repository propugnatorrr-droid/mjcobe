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

export type SongUpdateAdminState = {
  ok?: string;
  error?: string;
};

type SongContext = {
  id: string;
  slug: string;
};

type UpdateValues = {
  campaignId: string | null;
  title: string;
  body: string;
  minTierCents: number;
  publishedAt: Date | null;
  isVisible: boolean;
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

function optionalDate(
  value: FormDataEntryValue | null,
): {
  valid: boolean;
  value: Date | null;
} {
  const input = str(
    value,
    40,
  );

  if (!input) {
    return {
      valid: true,
      value: null,
    };
  }

  const date = new Date(
    input.endsWith('Z')
      ? input
      : `${input}Z`,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return {
      valid: false,
      value: null,
    };
  }

  return {
    valid: true,
    value: date,
  };
}

function minimumTierCents(
  value: FormDataEntryValue | null,
): {
  valid: boolean;
  value: number;
} {
  const input = str(
    value,
    40,
  );

  if (!input) {
    return {
      valid: true,
      value: 0,
    };
  }

  const amount =
    parseAmountCents(input);

  if (amount === null) {
    return {
      valid: false,
      value: 0,
    };
  }

  return {
    valid: true,
    value: amount,
  };
}

async function getSongContext(
  songId: string,
): Promise<SongContext | null> {
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

async function campaignBelongsToSong(
  campaignId: string | null,
  songId: string,
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
      and(
        eq(
          s.campaigns.id,
          campaignId,
        ),
        eq(
          s.campaigns.songId,
          songId,
        ),
      ),
    )
    .limit(1);

  return Boolean(campaign);
}

async function valuesFrom(
  formData: FormData,
  songId: string,
): Promise<UpdateValues | null> {
  const title = str(
    formData.get('title'),
    200,
  );

  const body = str(
    formData.get('body'),
    8000,
  );

  const campaignId = str(
    formData.get('campaignId'),
    80,
  );

  const minimum =
    minimumTierCents(
      formData.get(
        'minTierAmount',
      ),
    );

  const publication =
    optionalDate(
      formData.get(
        'publishedAt',
      ),
    );

  if (
    !title ||
    !body ||
    !minimum.valid ||
    !publication.valid
  ) {
    return null;
  }

  if (
    !await campaignBelongsToSong(
      campaignId,
      songId,
    )
  ) {
    return null;
  }

  return {
    campaignId,
    title,
    body,
    minTierCents:
      minimum.value,
    publishedAt:
      publication.value,
    isVisible: bool(
      formData.get(
        'isVisible',
      ),
    ),
  };
}

function revalidateUpdateSurfaces(
  songId: string,
  songSlug: string,
): void {
  revalidatePath(
    `/admin/songs/${songId}`,
  );

  revalidatePath(
    `/song/${songSlug}`,
  );
}

export async function createSongUpdate(
  _previous:
    SongUpdateAdminState,
  formData: FormData,
): Promise<SongUpdateAdminState> {
  const me = await requireAdmin();

  const songId = str(
    formData.get('songId'),
    80,
  );

  if (!songId) {
    return {
      error: 'invalid',
    };
  }

  const song =
    await getSongContext(
      songId,
    );

  if (!song) {
    return {
      error: 'invalid',
    };
  }

  const values =
    await valuesFrom(
      formData,
      song.id,
    );

  if (!values) {
    return {
      error: 'invalid',
    };
  }

  const [created] = await dbw
    .insert(s.songUpdates)
    .values({
      songId: song.id,
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
      'song_update.create',
    entity: 'song_update',
    entityId: created.id,
    after: created,
    ipHash:
      await requestIpHash(),
  });

  revalidateUpdateSurfaces(
    song.id,
    song.slug,
  );

  return {
    ok: 'saved',
  };
}

export async function updateSongUpdate(
  _previous:
    SongUpdateAdminState,
  formData: FormData,
): Promise<SongUpdateAdminState> {
  const me = await requireAdmin();

  const updateId = str(
    formData.get('updateId'),
    80,
  );

  if (!updateId) {
    return {
      error: 'invalid',
    };
  }

  const [before] = await db
    .select()
    .from(s.songUpdates)
    .where(
      eq(
        s.songUpdates.id,
        updateId,
      ),
    )
    .limit(1);

  if (!before) {
    return {
      error: 'missing',
    };
  }

  const song =
    await getSongContext(
      before.songId,
    );

  if (!song) {
    return {
      error: 'missing',
    };
  }

  const values =
    await valuesFrom(
      formData,
      song.id,
    );

  if (!values) {
    return {
      error: 'invalid',
    };
  }

  const [after] = await dbw
    .update(s.songUpdates)
    .set(values)
    .where(
      eq(
        s.songUpdates.id,
        updateId,
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
      'song_update.update',
    entity: 'song_update',
    entityId: updateId,
    before,
    after,
    ipHash:
      await requestIpHash(),
  });

  revalidateUpdateSurfaces(
    song.id,
    song.slug,
  );

  return {
    ok: 'saved',
  };
}

export async function setSongUpdatePublication(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();

  const updateId = str(
    formData.get('updateId'),
    80,
  );

  if (!updateId) {
    return;
  }

  const [before] = await db
    .select()
    .from(s.songUpdates)
    .where(
      eq(
        s.songUpdates.id,
        updateId,
      ),
    )
    .limit(1);

  if (!before) {
    return;
  }

  const song =
    await getSongContext(
      before.songId,
    );

  if (!song) {
    return;
  }

  const publish =
    formData.get('publish') ===
    'true';

  const publishedAt = publish
    ? before.publishedAt ??
      new Date()
    : null;

  await dbw
    .update(s.songUpdates)
    .set({
      publishedAt,
    })
    .where(
      eq(
        s.songUpdates.id,
        updateId,
      ),
    );

  await recordAudit({
    adminUserId: me.id,
    action: publish
      ? 'song_update.publish'
      : 'song_update.unpublish',
    entity: 'song_update',
    entityId: updateId,
    before: {
      publishedAt:
        before.publishedAt,
    },
    after: {
      publishedAt,
    },
    ipHash:
      await requestIpHash(),
  });

  revalidateUpdateSurfaces(
    song.id,
    song.slug,
  );
}

export async function setSongUpdateVisibility(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();

  const updateId = str(
    formData.get('updateId'),
    80,
  );

  if (!updateId) {
    return;
  }

  const [before] = await db
    .select()
    .from(s.songUpdates)
    .where(
      eq(
        s.songUpdates.id,
        updateId,
      ),
    )
    .limit(1);

  if (!before) {
    return;
  }

  const song =
    await getSongContext(
      before.songId,
    );

  if (!song) {
    return;
  }

  const isVisible =
    formData.get('isVisible') ===
    'true';

  await dbw
    .update(s.songUpdates)
    .set({
      isVisible,
    })
    .where(
      eq(
        s.songUpdates.id,
        updateId,
      ),
    );

  await recordAudit({
    adminUserId: me.id,
    action: isVisible
      ? 'song_update.show'
      : 'song_update.hide',
    entity: 'song_update',
    entityId: updateId,
    before: {
      isVisible:
        before.isVisible,
    },
    after: {
      isVisible,
    },
    ipHash:
      await requestIpHash(),
  });

  revalidateUpdateSurfaces(
    song.id,
    song.slug,
  );
}
