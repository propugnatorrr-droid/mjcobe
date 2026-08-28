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

export async function assignLibraryMedia(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();

  const songId = str(
    formData.get('songId'),
    80,
  );

  const assetId = str(
    formData.get('assetId'),
    80,
  );

  const assignment = str(
    formData.get('assignment'),
    20,
  );

  if (
    !songId ||
    !assetId ||
    (
      assignment !== 'cover' &&
      assignment !== 'audio'
    )
  ) {
    return;
  }

  const [
    song,
    asset,
  ] = await Promise.all([
    db
      .select()
      .from(s.songs)
      .where(
        eq(
          s.songs.id,
          songId,
        ),
      )
      .limit(1)
      .then(
        (rows) =>
          rows[0] ?? null,
      ),

    db
      .select()
      .from(s.mediaAssets)
      .where(
        eq(
          s.mediaAssets.id,
          assetId,
        ),
      )
      .limit(1)
      .then(
        (rows) =>
          rows[0] ?? null,
      ),
  ]);

  if (!song || !asset) {
    return;
  }

  if (
    assignment === 'cover' &&
    asset.kind !== 'image'
  ) {
    return;
  }

  if (
    assignment === 'audio' &&
    asset.kind !== 'audio'
  ) {
    return;
  }

  const previousAssetId =
    assignment === 'cover'
      ? song.coverAssetId
      : song.audioAssetId;

  if (
    previousAssetId ===
    asset.id
  ) {
    return;
  }

  if (
    assignment === 'cover'
  ) {
    await dbw
      .update(s.songs)
      .set({
        coverAssetId:
          asset.id,
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          s.songs.id,
          song.id,
        ),
      );
  } else {
    const durationMs =
      asset.durationMs;

    const safePreviewEnd =
      durationMs &&
      durationMs > 0
        ? Math.min(
            30_000,
            durationMs,
          )
        : 30_000;

    await dbw
      .update(s.songs)
      .set({
        audioAssetId:
          asset.id,
        previewStartMs: 0,
        previewEndMs:
          safePreviewEnd,
        allowFullPlayback:
          false,
        updatedAt:
          new Date(),
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
      `song.${assignment}.assign_library`,
    entity: 'song',
    entityId: song.id,
    before: {
      assetId:
        previousAssetId,
    },
    after: {
      assetId: asset.id,
      path: asset.path,
      kind: asset.kind,
      role: asset.role,
    },
    ipHash:
      await requestIpHash(),
  });

  revalidatePath(
    `/admin/songs/${song.id}`,
  );

  revalidatePath(
    `/song/${song.slug}`,
  );

  revalidatePath('/admin/media');
  revalidatePath('/music');
  revalidatePath('/journey');
  revalidatePath('/', 'layout');
}
