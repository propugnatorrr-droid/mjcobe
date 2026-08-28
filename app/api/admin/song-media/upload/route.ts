import {
  handleUpload,
  type HandleUploadBody,
} from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import {
  requireAdmin,
} from '@/lib/admin/guard';
import {
  isSongMediaKind,
  SONG_MEDIA_POLICY,
} from '@/lib/media/song-media-policy';

export const runtime = 'nodejs';

type ClientPayload = {
  songId?: unknown;
  kind?: unknown;
};

function parseClientPayload(
  value: string | null,
): ClientPayload | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(
      value,
    ) as ClientPayload;
  } catch {
    return null;
  }
}

export async function POST(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as
        HandleUploadBody;

    const response = await handleUpload({
      request,
      body,

      onBeforeGenerateToken:
        async (
          pathname,
          clientPayload,
        ) => {
          await requireAdmin();

          const payload =
            parseClientPayload(
              clientPayload,
            );

          const songId =
            typeof payload?.songId ===
            'string'
              ? payload.songId
              : null;

          const kind = payload?.kind;

          if (
            !songId ||
            !isSongMediaKind(kind)
          ) {
            throw new Error(
              'Invalid upload payload.',
            );
          }

          const [song] = await db
            .select({
              id: s.songs.id,
            })
            .from(s.songs)
            .where(
              eq(
                s.songs.id,
                songId,
              ),
            )
            .limit(1);

          if (!song) {
            throw new Error(
              'Song not found.',
            );
          }

          const expectedPrefix =
            `songs/${songId}/${kind}-`;

          if (
            !pathname.startsWith(
              expectedPrefix,
            )
          ) {
            throw new Error(
              'Invalid upload path.',
            );
          }

          const policy =
            SONG_MEDIA_POLICY[kind];

          return {
            allowedContentTypes:
              [
                ...policy
                  .allowedContentTypes,
              ],
            maximumSizeInBytes:
              policy
                .maximumSizeInBytes,
            addRandomSuffix: true,
            allowOverwrite: false,
            cacheControlMaxAge:
              31_536_000,
          };
        },
    });

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        error: 'Upload denied.',
      },
      {
        status: 400,
      },
    );
  }
}
