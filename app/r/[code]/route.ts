import {
  createHash,
} from 'node:crypto';
import {
  NextRequest,
  NextResponse,
} from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import {
  createReferralCookie,
  newReferralSessionId,
  REFERRAL_COOKIE,
  REFERRAL_SESSION_COOKIE,
  REFERRAL_TTL_SECONDS,
} from '@/lib/checkout/referrals';

function hash(
  value: string,
): string {
  return createHash(
    'sha256',
  )
    .update(value)
    .digest('hex');
}

export async function GET(
  request: NextRequest,
  context: {
    params:
      Promise<{
        code: string;
      }>;
  },
) {
  const { code } =
    await context.params;

  const normalizedCode =
    code.trim().toLowerCase();

  const [link] =
    await db
      .select({
        id:
          s.referralLinks.id,
        campaignId:
          s.referralLinks
            .campaignId,
        songSlug:
          s.songs.slug,
      })
      .from(
        s.referralLinks,
      )
      .leftJoin(
        s.campaigns,
        eq(
          s.campaigns.id,
          s.referralLinks
            .campaignId,
        ),
      )
      .leftJoin(
        s.songs,
        eq(
          s.songs.id,
          s.campaigns.songId,
        ),
      )
      .where(
        eq(
          s.referralLinks.code,
          normalizedCode,
        ),
      )
      .limit(1);

  if (
    !link ||
    !link.campaignId ||
    !link.songSlug
  ) {
    return NextResponse.redirect(
      new URL('/', request.url),
      302,
    );
  }

  const existingSession =
    request.cookies.get(
      REFERRAL_SESSION_COOKIE,
    )?.value;

  const sessionId =
    existingSession &&
    /^[0-9a-f-]{36}$/i.test(
      existingSession,
    )
      ? existingSession
      : newReferralSessionId();

  const forwarded =
    request.headers
      .get('x-forwarded-for')
      ?.split(',')[0]
      ?.trim();

  await dbw
    .insert(
      s.referralVisits,
    )
    .values({
      referralLinkId:
        link.id,
      sessionId,
      ipHash:
        forwarded
          ? hash(forwarded)
          : null,
      userAgent:
        request.headers
          .get('user-agent')
          ?.slice(0, 500) ??
        null,
    });

  const response =
    NextResponse.redirect(
      new URL(
        `/song/${link.songSlug}`,
        request.url,
      ),
      302,
    );

  const secure =
    process.env.NODE_ENV ===
    'production';

  response.cookies.set(
    REFERRAL_SESSION_COOKIE,
    sessionId,
    {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge:
        REFERRAL_TTL_SECONDS,
      path: '/',
    },
  );

  response.cookies.set(
    REFERRAL_COOKIE,
    createReferralCookie({
      referralLinkId:
        link.id,
      campaignId:
        link.campaignId,
    }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge:
        REFERRAL_TTL_SECONDS,
      path: '/',
    },
  );

  return response;
}
