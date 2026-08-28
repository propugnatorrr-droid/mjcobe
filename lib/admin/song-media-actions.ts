'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { head } from '@vercel/blob';
import { eq } from 'drizzle-orm';
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
  str,
} from '@/lib/checkout/validate';
import {
  contentTypeAllowed,
  isSongMediaKind,
  SONG_MEDIA_POLICY,
  type SongMediaKind,
} from '@/lib/media/song-media-policy';

export type SongMediaState = {
  ok?: string;
  error?: string;
};

export type RegisterSongMediaInput = {
  songId: string;
  kind: SongMediaKind;
  url: string;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
};

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

async function songContext(
  songId: string,
) {
  const [song] = await db
    .select()
    .from(s.songs)
    .where(eq(s.songs.id, songId))
    .limit(1);

  return song ?? null;
}

function revalidateSongMedia(
  songId: string,
  slug: string,
) {
  revalidatePath(
    `/admin/songs/${songId}`,
  );
  revalidatePath(`/song/${slug}`);
  revalidatePath('/music');
  revalidatePath('/journey');
  revalidatePath('/', 'layout');
}

function validDimension(
  value: number | null | undefined,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= 8192
  );
}

function validDuration(
  value: number | null | undefined,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= 3_600_000
  );
}

export async function registerSongMedia(
  input: RegisterSongMediaInput,
): Promise<SongMediaState> {
  const me = await requireAdmin();

  if (
    !input.songId ||
    !isSongMediaKind(input.kind) ||
    !input.url.startsWith('https://')
  ) {
    return { error: 'invalid' };
  }

  const song = await songContext(
    input.songId,
  );

  if (!song) {
    return { error: 'missing' };
  }

  let blob: Awaited<
    ReturnType<typeof head>
  >;

  try {
    blob = await head(input.url);
  } catch {
    return { error: 'upload' };
  }

  const expectedPrefix =
    `songs/${input.songId}/${input.kind}-`;

  if (
    !blob.pathname.startsWith(
      expectedPrefix,
    ) ||
    !contentTypeAllowed(
      input.kind,
      blob.contentType,
    ) ||
    blob.size >
      SONG_MEDIA_POLICY[
        input.kind
      ].maximumSizeInBytes
  ) {
    return { error: 'invalid' };
  }

  if (
    input.kind === 'cover' &&
    (
      !validDimension(input.width) ||
      !validDimension(input.height)
    )
  ) {
    return { error: 'metadata' };
  }

  if (
    input.kind === 'audio' &&
    !validDuration(input.durationMs)
  ) {
    return { error: 'metadata' };
  }

  const [existing] = await db
    .select()
    .from(s.mediaAssets)
    .where(
      eq(
        s.mediaAssets.path,
        blob.url,
      ),
    )
    .limit(1);

  let assetId = existing?.id ?? null;

  if (!assetId) {
    const [created] = await dbw
      .insert(s.mediaAssets)
      .values({
        kind:
          input.kind === 'cover'
            ? 'image'
            : 'audio',
        role:
          input.kind === 'cover'
            ? 'cover'
            : 'preview',
        path: blob.url,
        derivatives: {},
        width:
          input.kind === 'cover'
            ? input.width
            : null,
        height:
          input.kind === 'cover'
            ? input.height
            : null,
        durationMs:
          input.kind === 'audio'
            ? input.durationMs
            : null,
        bytes: blob.size,
        altCopyKey: null,
      })
      .returning({
        id: s.mediaAssets.id,
      });

    assetId = created.id;
  }

  const previousAssetId =
    input.kind === 'cover'
      ? song.coverAssetId
      : song.audioAssetId;

  if (previousAssetId === assetId) {
    return { ok: 'saved' };
  }

  if (input.kind === 'cover') {
    await dbw
      .update(s.songs)
      .set({
        coverAssetId: assetId,
        updatedAt: new Date(),
      })
      .where(
        eq(
          s.songs.id,
          song.id,
        ),
      );
  } else {
    const durationMs =
      input.durationMs as number;

    await dbw
      .update(s.songs)
      .set({
        audioAssetId: assetId,
        previewStartMs: 0,
        previewEndMs: Math.min(
          30_000,
          durationMs,
        ),
        updatedAt: new Date(),
      })
      .where(
        eq(
          s.songs.id,
          song.id,
        ),
      );
  }

  await recordAudit({
    adminUserId: me.id,
    action:
      `song.${input.kind}.assign`,
    entity: 'song',
    entityId: song.id,
    before: {
      assetId: previousAssetId,
    },
    after: {
      assetId,
      path: blob.url,
      contentType:
        blob.contentType,
      bytes: blob.size,
    },
    ipHash: await ipHash(),
  });

  revalidateSongMedia(
    song.id,
    song.slug,
  );

  return { ok: 'saved' };
}

function secondsValue(
  value: FormDataEntryValue | null,
): number | null {
  const input = str(value, 20);

  if (!input) {
    return null;
  }

  const parsed = Number(input);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return null;
  }

  return Math.round(parsed * 1000);
}

export async function updateSongPlayback(
  _previous: SongMediaState,
  formData: FormData,
): Promise<SongMediaState> {
  const me = await requireAdmin();

  const songId = str(
    formData.get('songId'),
  );

  const previewStartMs =
    secondsValue(
      formData.get(
        'previewStartSeconds',
      ),
    );

  const previewEndMs =
    secondsValue(
      formData.get(
        'previewEndSeconds',
      ),
    );

  if (
    !songId ||
    previewStartMs === null ||
    previewEndMs === null ||
    previewEndMs <= previewStartMs
  ) {
    return { error: 'invalid' };
  }

  const song =
    await songContext(songId);

  if (!song) {
    return { error: 'missing' };
  }

  const allowFullPlayback = bool(
    formData.get('allowFullPlayback'),
  );

  if (
    !allowFullPlayback &&
    previewEndMs -
      previewStartMs >
      60_000
  ) {
    return {
      error: 'preview_too_long',
    };
  }

  await dbw
    .update(s.songs)
    .set({
      previewStartMs,
      previewEndMs,
      allowFullPlayback,
      updatedAt: new Date(),
    })
    .where(
      eq(
        s.songs.id,
        song.id,
      ),
    );

  await recordAudit({
    adminUserId: me.id,
    action: 'song.playback.update',
    entity: 'song',
    entityId: song.id,
    before: {
      previewStartMs:
        song.previewStartMs,
      previewEndMs:
        song.previewEndMs,
      allowFullPlayback:
        song.allowFullPlayback,
    },
    after: {
      previewStartMs,
      previewEndMs,
      allowFullPlayback,
    },
    ipHash: await ipHash(),
  });

  revalidateSongMedia(
    song.id,
    song.slug,
  );

  return { ok: 'saved' };
}
