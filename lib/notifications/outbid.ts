import 'server-only';

import {
  and,
  desc,
  eq,
  gte,
  sql,
} from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import {
  minimumToLead,
  shouldSendOutbid,
} from '@/lib/ranking/order';
import {
  settledLeaderboard,
} from '@/lib/ranking/settled';

type Scope =
  | 'fan'
  | 'business';

function nextAllowedDelivery(
  startHour: number,
  endHour: number,
  now = new Date(),
): Date {
  const hour =
    now.getUTCHours();

  const insideQuietHours =
    startHour < endHour
      ? hour >= startHour &&
        hour < endHour
      : hour >= startHour ||
        hour < endHour;

  if (!insideQuietHours) {
    return now;
  }

  const scheduled =
    new Date(now);

  scheduled.setUTCMinutes(
    0,
    0,
    0,
  );

  if (hour < endHour) {
    scheduled.setUTCHours(
      endHour,
    );
  } else {
    scheduled.setUTCDate(
      scheduled.getUTCDate() +
        1,
    );
    scheduled.setUTCHours(
      endHour,
    );
  }

  return scheduled;
}

export async function queueOutbidNotification(
  input: {
    campaignId: string;
    supportType: Scope;
    winningContributionId:
      string;
    previousLeaderId:
      string | null;
  },
): Promise<void> {
  if (!input.previousLeaderId) {
    return;
  }

  const leaders =
    await settledLeaderboard({
      campaignId:
        input.campaignId,
      supportType:
        input.supportType,
      limit: 2,
    });

  const currentLeader =
    leaders[0];

  if (
    !currentLeader ||
    !shouldSendOutbid({
      previousLeaderId:
        input.previousLeaderId,
      currentLeaderId:
        currentLeader.identityId,
      winnerIdentityId:
        currentLeader.identityId,
    })
  ) {
    return;
  }

  const [campaign] =
    await db
      .select({
        campaignName:
          s.campaigns.name,
        songTitle:
          s.songs.title,
        songSlug:
          s.songs.slug,
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
          input.campaignId,
        ),
      )
      .limit(1);

  if (!campaign) {
    return;
  }

  let recipientEmail:
    string | null = null;

  let supporterId:
    string | null = null;

  let sponsorId:
    string | null = null;

  let scheduledAt =
    new Date();

  if (
    input.supportType ===
    'fan'
  ) {
    const [supporter] =
      await db
        .select({
          id:
            s.supporters.id,
          email:
            s.supporters.email,
          competitiveAlerts:
            s.notificationPrefs
              .competitiveAlerts,
          quietHoursStart:
            s.notificationPrefs
              .quietHoursStart,
          quietHoursEnd:
            s.notificationPrefs
              .quietHoursEnd,
        })
        .from(s.supporters)
        .leftJoin(
          s.notificationPrefs,
          eq(
            s.notificationPrefs
              .supporterId,
            s.supporters.id,
          ),
        )
        .where(
          eq(
            s.supporters.id,
            input.previousLeaderId,
          ),
        )
        .limit(1);

    if (
      !supporter?.email ||
      supporter
        .competitiveAlerts ===
        false
    ) {
      return;
    }

    recipientEmail =
      supporter.email;

    supporterId =
      supporter.id;

    scheduledAt =
      nextAllowedDelivery(
        supporter
          .quietHoursStart ??
          22,
        supporter
          .quietHoursEnd ??
          9,
      );
  } else {
    const [sponsor] =
      await db
        .select({
          id:
            s.sponsors.id,
          email:
            s.sponsors.email,
        })
        .from(s.sponsors)
        .where(
          eq(
            s.sponsors.id,
            input.previousLeaderId,
          ),
        )
        .limit(1);

    if (!sponsor?.email) {
      return;
    }

    recipientEmail =
      sponsor.email;

    sponsorId =
      sponsor.id;
  }

  const frequencyWindow =
    new Date(
      Date.now() -
        60 * 60 * 1000,
    );

  const [recent] =
    await db
      .select({
        count:
          sql<number>`
            count(*)::int
          `,
      })
      .from(s.notifications)
      .where(
        and(
          eq(
            s.notifications.kind,
            'outbid',
          ),
          eq(
            s.notifications
              .recipientEmail,
            recipientEmail,
          ),
          gte(
            s.notifications
              .createdAt,
            frequencyWindow,
          ),
        ),
      )
      .orderBy(
        desc(
          s.notifications
            .createdAt,
        ),
      );

  if (
    Number(
      recent?.count ?? 0,
    ) >= 2
  ) {
    scheduledAt =
      new Date(
        Date.now() +
          60 * 60 * 1000,
      );
  }

  const displaced =
    leaders.find(
      (row) =>
        row.identityId ===
        input.previousLeaderId,
    );

  const displacedAmount =
    displaced?.amountCents ??
    0;

  const incrementCents = 100;

  await dbw
    .insert(s.notifications)
    .values({
      supporterId,
      sponsorId,
      kind: 'outbid',
      dedupeKey: [
        'outbid',
        input.campaignId,
        input.supportType,
        input.previousLeaderId,
        input.winningContributionId,
      ].join(':'),
      recipientEmail,
      scheduledAt,
      payload: {
        songTitle:
          campaign.songTitle,
        songSlug:
          campaign.songSlug,
        scope:
          input.supportType,
        leadingAmountCents:
          currentLeader.amountCents,
        minimumToReclaimCents:
          minimumToLead(
            currentLeader.amountCents,
            displacedAmount,
            incrementCents,
          ),
      },
    })
    .onConflictDoNothing();
}
