import 'server-only';

import {
  randomBytes,
} from 'node:crypto';
import {
  cookies,
} from 'next/headers';
import {
  and,
  eq,
  sql,
} from 'drizzle-orm';
import {
  db,
} from '@/lib/db/client';
import {
  dbw,
} from '@/lib/db/write';
import * as s from '@/lib/db/schema';

const ACCESS_COOKIE_PREFIX =
  'mjcobe_access_';

const ACCESS_MAX_AGE =
  60 * 60 * 24 * 365;

function cookieName(
  campaignId: string,
): string {
  return (
    ACCESS_COOKIE_PREFIX +
    campaignId
  );
}

function accessTarget(
  campaignId: string,
): string {
  return (
    `/supporter-access/${campaignId}`
  );
}

function validCode(
  value: string,
): boolean {
  return (
    value.length >= 24 &&
    value.length <= 100 &&
    /^[A-Za-z0-9_-]+$/.test(
      value,
    )
  );
}

export async function grantSupporterAccess(
  args: {
    campaignId: string;
    contributionId: string;
  },
): Promise<void> {
  const code =
    randomBytes(32).toString(
      'base64url',
    );

  await dbw
    .insert(s.shareLinks)
    .values({
      code,
      targetPath:
        accessTarget(
          args.campaignId,
        ),
      contributionId:
        args.contributionId,
    });

  const cookieStore =
    await cookies();

  cookieStore.set(
    cookieName(
      args.campaignId,
    ),
    code,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        'production',
      sameSite: 'strict',
      path: '/song',
      maxAge: ACCESS_MAX_AGE,
    },
  );
}

export async function supporterAccessForCampaign(
  campaignId: string,
): Promise<number> {
  const cookieStore =
    await cookies();

  const code =
    cookieStore.get(
      cookieName(campaignId),
    )?.value;

  if (
    !code ||
    !validCode(code)
  ) {
    return 0;
  }

  const [row] = await db
    .select({
      contributionId:
        s.contributions.id,
      supportType:
        s.contributions
          .supportType,
      netCents: sql<number>`
        coalesce(
          sum(
            ${s.ledgerEntries.amountCents}
          ),
          0
        )::int
      `,
    })
    .from(s.shareLinks)
    .innerJoin(
      s.contributions,
      eq(
        s.contributions.id,
        s.shareLinks
          .contributionId,
      ),
    )
    .leftJoin(
      s.ledgerEntries,
      eq(
        s.ledgerEntries
          .contributionId,
        s.contributions.id,
      ),
    )
    .where(
      and(
        eq(
          s.shareLinks.code,
          code,
        ),
        eq(
          s.shareLinks.targetPath,
          accessTarget(
            campaignId,
          ),
        ),
        eq(
          s.contributions
            .campaignId,
          campaignId,
        ),
        eq(
          s.contributions
            .supportType,
          'fan',
        ),
      ),
    )
    .groupBy(
      s.contributions.id,
      s.contributions
        .supportType,
    )
    .limit(1);

  if (
    !row ||
    row.supportType !== 'fan'
  ) {
    return 0;
  }

  return Math.max(
    0,
    Number(
      row.netCents ?? 0,
    ),
  );
}
