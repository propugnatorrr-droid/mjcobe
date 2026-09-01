import 'server-only';

import { asc, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import {
  settledLeaderboard,
} from '@/lib/ranking/settled';
import {
  fanBadgeKeys,
} from '@/lib/supporter/badge-rules';

/**
 * Grants badges for a fan contribution that has already settled.
 *
 * This runs AFTER the settlement transaction commits, so the ledger entry is
 * visible to the ranking query and a badge failure can never roll back or
 * alter a successful payment. Idempotent through badge_grants_unique_idx.
 */
export async function grantFanSettlementBadges(
  input: {
    campaignId: string;
    supporterId: string;
    amountCents: number;
    supporterNumber: number | null;
    foundingNumber: number | null;
  },
): Promise<string[]> {
  const leaders =
    await settledLeaderboard({
      campaignId: input.campaignId,
      supportType: 'fan',
      limit: 100,
    });

  const position = leaders.findIndex(
    (row) =>
      row.identityId ===
      input.supporterId,
  );

  const keys = fanBadgeKeys({
    amountCents: input.amountCents,
    supporterNumber:
      input.supporterNumber,
    foundingNumber:
      input.foundingNumber,
    rank:
      position >= 0
        ? position + 1
        : null,
  });

  if (keys.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: s.badges.id,
      key: s.badges.key,
    })
    .from(s.badges)
    .where(
      inArray(
        s.badges.key,
        keys as unknown as string[],
      ),
    )
    .orderBy(asc(s.badges.sortIndex));

  if (rows.length === 0) {
    return [];
  }

  await dbw
    .insert(s.badgeGrants)
    .values(
      rows.map((badge) => ({
        badgeId: badge.id,
        supporterId:
          input.supporterId,
        campaignId:
          input.campaignId,
      })),
    )
    .onConflictDoNothing();

  return rows.map(
    (badge) => badge.key,
  );
}
