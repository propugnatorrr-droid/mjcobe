import {
  randomUUID,
} from 'node:crypto';
import {
  NextRequest,
  NextResponse,
} from 'next/server';
import {
  and,
  eq,
  gte,
  sql,
} from 'drizzle-orm';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import {
  analyticsKindNeedsCampaign,
  analyticsKindNeedsSong,
  parseAnalyticsPayload,
} from '@/lib/analytics/contracts';

export const runtime = 'nodejs';

const SESSION_COOKIE =
  'mjcobe_analytics_session';

const SESSION_MAX_AGE =
  60 * 60 * 24 * 365;

const MAX_EVENTS_PER_MINUTE =
  60;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeSessionId(
  request: NextRequest,
): string {
  const existing =
    request.cookies.get(
      SESSION_COOKIE,
    )?.value;

  if (
    existing &&
    UUID_RE.test(existing)
  ) {
    return existing;
  }

  return randomUUID();
}

function safeReferrerOrigin(
  value:
    | string
    | undefined,
): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(
      value,
    ).origin.slice(
      0,
      200,
    );
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
) {
  const contentLength =
    Number(
      request.headers.get(
        'content-length',
      ) ?? 0,
    );

  if (
    contentLength >
    16_384
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Payload too large.',
      },
      {
        status: 413,
      },
    );
  }

  let raw: unknown;

  try {
    raw =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Invalid JSON.',
      },
      {
        status: 400,
      },
    );
  }

  const payload =
    parseAnalyticsPayload(
      raw,
    );

  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Invalid analytics event.',
      },
      {
        status: 400,
      },
    );
  }

  const sessionId =
    safeSessionId(
      request,
    );

  const since =
    new Date(
      Date.now() -
        60_000,
    );

  const [recent] =
    await dbw
      .select({
        count:
          sql<number>`
            count(*)::int
          `,
      })
      .from(
        s.analyticsEvents,
      )
      .where(
        and(
          eq(
            s.analyticsEvents
              .sessionId,
            sessionId,
          ),
          gte(
            s.analyticsEvents
              .occurredAt,
            since,
          ),
        ),
      );

  if (
    Number(
      recent?.count ?? 0,
    ) >=
    MAX_EVENTS_PER_MINUTE
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Rate limit exceeded.',
      },
      {
        status: 429,
      },
    );
  }

  let songId =
    payload.songId ??
    null;

  let campaignId =
    payload.campaignId ??
    null;

  if (campaignId) {
    const [campaign] =
      await dbw
        .select({
          id:
            s.campaigns.id,
          songId:
            s.campaigns.songId,
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
      return NextResponse.json(
        {
          ok: false,
          error:
            'Unknown campaign.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      songId &&
      songId !==
        campaign.songId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Campaign does not belong to song.',
        },
        {
          status: 400,
        },
      );
    }

    songId =
      campaign.songId;
  }

  if (
    songId &&
    !campaignId
  ) {
    const [song] =
      await dbw
        .select({
          id: s.songs.id,
        })
        .from(s.songs)
        .where(
          and(
            eq(
              s.songs.id,
              songId,
            ),
            eq(
              s.songs
                .isPublished,
              true,
            ),
          ),
        )
        .limit(1);

    if (!song) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Unknown song.',
        },
        {
          status: 400,
        },
      );
    }
  }

  if (
    analyticsKindNeedsSong(
      payload.kind,
    ) &&
    !songId
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Song is required.',
      },
      {
        status: 400,
      },
    );
  }

  if (
    analyticsKindNeedsCampaign(
      payload.kind,
    ) &&
    !campaignId
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Campaign is required.',
      },
      {
        status: 400,
      },
    );
  }

  const eventKey =
    `${sessionId}:${payload.eventId}`;

  await dbw
    .insert(
      s.analyticsEvents,
    )
    .values({
      eventKey,
      kind:
        payload.kind,
      songId,
      campaignId,
      sessionId,
      path:
        payload.path ??
        null,
      referrer:
        safeReferrerOrigin(
          payload.referrer,
        ),
      meta:
        payload.meta ?? {},
    })
    .onConflictDoNothing();

  const response =
    NextResponse.json({
      ok: true,
    });

  response.cookies.set(
    SESSION_COOKIE,
    sessionId,
    {
      httpOnly: true,
      sameSite: 'lax',
      secure:
        process.env.NODE_ENV ===
        'production',
      maxAge:
        SESSION_MAX_AGE,
      path: '/',
    },
  );

  return response;
}
