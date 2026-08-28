import 'server-only';

import {
  asc,
  eq,
  sql,
} from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';

export type PublicSupportTier =
  typeof s.supportTiers.$inferSelect & {
    soldCount: number;
    remaining: number | null;
    isAvailable: boolean;
  };

type SoldRow = {
  tier_id: string;
  sold_count: number | string;
};

function resultRows(
  result: unknown,
): SoldRow[] {
  return (
    result as {
      rows?: SoldRow[];
    }
  ).rows ?? [];
}

/**
 * A tier sale counts while its contribution
 * retains a positive ledger balance.
 *
 * Fully refunded contributions therefore return
 * their place to a quantity-limited tier.
 */
async function soldCounts(
  campaignId: string,
): Promise<Map<string, number>> {
  const result = await db.execute(sql`
    select
      c.tier_id,
      count(*)::int as sold_count
    from contributions c
    where
      c.campaign_id = ${campaignId}
      and c.support_type = 'fan'
      and c.tier_id is not null
      and (
        select coalesce(
          sum(le.amount_cents),
          0
        )
        from ledger_entries le
        where
          le.contribution_id = c.id
      ) > 0
    group by c.tier_id
  `);

  return new Map(
    resultRows(result).map((row) => [
      row.tier_id,
      Number(row.sold_count),
    ]),
  );
}

export async function getPublicSupportTiers(
  campaignId: string,
): Promise<PublicSupportTier[]> {
  const [tiers, counts] = await Promise.all([
    db
      .select()
      .from(s.supportTiers)
      .where(
        eq(
          s.supportTiers.campaignId,
          campaignId,
        ),
      )
      .orderBy(
        asc(s.supportTiers.sortIndex),
        asc(s.supportTiers.amountCents),
      ),
    soldCounts(campaignId),
  ]);

  const now = Date.now();

  return tiers
    .filter((tier) => {
      if (!tier.isActive) {
        return false;
      }

      if (
        tier.startsAt &&
        tier.startsAt.getTime() > now
      ) {
        return false;
      }

      if (
        tier.expiresAt &&
        tier.expiresAt.getTime() <= now
      ) {
        return false;
      }

      return true;
    })
    .map((tier) => {
      const soldCount =
        counts.get(tier.id) ?? 0;

      const remaining =
        tier.quantityLimit === null
          ? null
          : Math.max(
              tier.quantityLimit -
                soldCount,
              0,
            );

      return {
        ...tier,
        soldCount,
        remaining,
        isAvailable:
          remaining === null ||
          remaining > 0,
      };
    });
}

export async function getSelectableTier(
  campaignId: string,
  tierId: string,
): Promise<PublicSupportTier | null> {
  const tiers =
    await getPublicSupportTiers(
      campaignId,
    );

  return (
    tiers.find(
      (tier) =>
        tier.id === tierId &&
        tier.isAvailable,
    ) ?? null
  );
}
