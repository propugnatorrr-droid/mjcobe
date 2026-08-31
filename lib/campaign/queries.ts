import 'server-only';
import { cache } from 'react';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import {
  rankStandings,
  fundedPercent,
  type Standing,
} from '@/lib/ranking/engine';
import { settingOr } from '@/lib/config/settings';

/**
 * Public totals are derived exclusively from ledger entries. A ledger entry
 * exists only after money has moved, so pending and declined transactions
 * never appear publicly and refunds correct totals through negative entries.
 */

export type CampaignTotals = {
  fanCents: number;
  sponsorCents: number;
  meterCents: number;
  goalCents: number;
  percent: number;
  supporterCount: number;
  sponsorCount: number;
};

type QueryRows = {
  rows?: Record<string, unknown>[];
};

function rowsFrom(result: unknown): Record<string, unknown>[] {
  if (
    typeof result === 'object' &&
    result !== null &&
    'rows' in result &&
    Array.isArray((result as QueryRows).rows)
  ) {
    return (result as QueryRows).rows ?? [];
  }

  return Array.isArray(result)
    ? (result as Record<string, unknown>[])
    : [];
}
export const getCampaignTotals = cache(
  async (campaignId: string): Promise<CampaignTotals> => {
    const result = await db.execute(sql`
      select
        coalesce(
          sum(case when c.support_type = 'fan' then l.amount_cents end),
          0
        )::int as fan_cents,
        coalesce(
          sum(case when c.support_type = 'business' then l.amount_cents end),
          0
        )::int as sponsor_cents,
        count(
          distinct case
            when c.support_type = 'fan' then c.supporter_id
          end
        )::int as supporter_count,
        count(
          distinct case
            when c.support_type = 'business' then c.sponsor_id
          end
        )::int as sponsor_count,
        max(cp.goal_cents)::int as goal_cents
      from ledger_entries l
      join contributions c on c.id = l.contribution_id
      join campaigns cp on cp.id = l.campaign_id
      where l.campaign_id = ${campaignId}
        and c.is_test = false
    `);

    const row = rowsFrom(result)[0];

    const fanCents = Number(row?.fan_cents ?? 0);
    const sponsorCents = Number(row?.sponsor_cents ?? 0);
    const goalCents = Number(row?.goal_cents ?? 0);

    const includeSponsorship = await settingOr(
      'meterIncludesSponsorship',
      false,
    );

    const meterCents = includeSponsorship
      ? fanCents + sponsorCents
      : fanCents;

    return {
      fanCents,
      sponsorCents,
      meterCents,
      goalCents,
      percent: fundedPercent(meterCents, goalCents),
      supporterCount: Number(row?.supporter_count ?? 0),
      sponsorCount: Number(row?.sponsor_count ?? 0),
    };
  },
);

export type LeaderboardRowData = {
  id: string;
  rank: number;
  name: string;
  amountCents: number;
  isAnonymous: boolean;
  hideAmount: boolean;
  slug?: string | null;
  logoPath?: string | null;
};

async function standingsFor(
  campaignId: string,
  scope: 'fan' | 'business',
) {
  const identityColumn =
    scope === 'fan'
      ? sql`c.supporter_id`
      : sql`c.sponsor_id`;

  const identityJoin =
    scope === 'business'
      ? sql`
          join sponsors sp on sp.id = c.sponsor_id
          left join media_assets ma on ma.id = sp.logo_asset_id
        `
      : sql`
          left join supporters su on su.id = c.supporter_id
        `;

  const liveName =
    scope === 'business'
      ? sql`max(sp.business_name)`
      : sql`max(su.display_name)`;

  const sponsorSlug =
    scope === 'business'
      ? sql`max(sp.slug)`
      : sql`null::text`;

  const sponsorLogo =
    scope === 'business'
      ? sql`max(ma.path)`
      : sql`null::text`;

  const moderationGuard =
    scope === 'business'
      ? sql`
          and c.moderation =
            'approved'
          and sp.moderation =
            'approved'
        `
      : sql`
          and c.moderation =
            'approved'
        `;

  const result = await db.execute(sql`
    select
      ${identityColumn} as id,
      sum(l.amount_cents)::int as amount_cents,
      min(l.occurred_at) as reached_at,
      bool_or(c.is_anonymous) as is_anonymous,
      bool_or(c.hide_amount) as hide_amount,
      max(c.display_name_snapshot) as snapshot_name,
      ${liveName} as live_name,
      ${sponsorSlug} as slug,
      ${sponsorLogo} as logo_path
    from ledger_entries l
    join contributions c on c.id = l.contribution_id
    ${identityJoin}
    where l.campaign_id = ${campaignId}
      and c.support_type = ${scope}
      and c.is_test = false
      and c.leaderboard_visible = true
      and ${identityColumn} is not null
      ${moderationGuard}
    group by ${identityColumn}
    having sum(l.amount_cents) > 0
  `);

  return rowsFrom(result);
}

export const getLeaderboard = cache(
  async (
    campaignId: string,
    scope: 'fan' | 'business',
    limit?: number,
  ): Promise<{
    rows: LeaderboardRowData[];
    totalCount: number;
  }> => {
    const raw = await standingsFor(campaignId, scope);

    const standings: Standing[] = raw.map((row) => ({
      id: String(row.id),
      amountCents: Number(row.amount_cents),
      reachedAt: new Date(String(row.reached_at)),
    }));

    const ranked = rankStandings(standings);
    const byId = new Map(
      raw.map((row) => [String(row.id), row]),
    );

    const rows = ranked.map((entry) => {
      const row = byId.get(entry.id);

      if (!row) {
        throw new Error(
          `Missing leaderboard identity ${entry.id}`,
        );
      }

      const anonymous = Boolean(row.is_anonymous);

      return {
        id: entry.id,
        rank: entry.rank,
        name: anonymous
          ? 'Anonymous'
          : String(
              row.snapshot_name ??
                row.live_name ??
                'Supporter',
            ),
        amountCents: entry.amountCents,
        isAnonymous: anonymous,
        hideAmount: Boolean(row.hide_amount),
        slug: row.slug ? String(row.slug) : null,
        logoPath: row.logo_path
          ? String(row.logo_path)
          : null,
      } satisfies LeaderboardRowData;
    });

    return {
      rows: limit ? rows.slice(0, limit) : rows,
      totalCount: rows.length,
    };
  },
);

/**
 * Campaign-level bid controls override global settings. Rankings are read
 * immediately before checkout rendering and again during a challenge submit.
 */
export const getTopSpot = cache(
  async (
    campaignId: string,
    scope: 'fan' | 'business',
  ) => {
    const [{ rows, totalCount }, campaign] =
      await Promise.all([
        getLeaderboard(campaignId, scope),
        db
          .select({
            minBidCents: s.campaigns.minBidCents,
            minIncrementCents:
              s.campaigns.minIncrementCents,
          })
          .from(s.campaigns)
          .where(eq(s.campaigns.id, campaignId))
          .limit(1)
          .then((result) => result[0] ?? null),
      ]);

    const leader = rows[0] ?? null;

    const defaultIncrement =
      scope === 'business'
        ? await settingOr('minIncrementCents', 50_000)
        : await settingOr('fanIncrementCents', 100);

    const defaultFloor = await settingOr(
      'minBidCents',
      1_000,
    );

    const incrementCents =
      campaign?.minIncrementCents ?? defaultIncrement;

    const floorCents =
      campaign?.minBidCents ?? defaultFloor;

    return {
      leader,
      totalCount,
      incrementCents,
      floorCents,
      minimumToLeadCents: Math.max(
        floorCents,
        (leader?.amountCents ?? 0) + incrementCents,
      ),
    };
  },
);
