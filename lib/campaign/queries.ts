import 'server-only';
import { cache } from 'react';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { rankStandings, fundedPercent, type Standing } from '@/lib/ranking/engine';
import { settingOr } from '@/lib/config/settings';

/**
 * Every total below is a plain SUM over ledger_entries with no transaction
 * state filter — because a ledger row exists only when money actually moved.
 * That invariant is why refunds are self-correcting here.
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

export const getCampaignTotals = cache(async (campaignId: string): Promise<CampaignTotals> => {
  const rows = await db.execute(sql`
    select
      coalesce(sum(case when c.support_type = 'fan' then l.amount_cents end), 0)::int as fan_cents,
      coalesce(sum(case when c.support_type = 'business' then l.amount_cents end), 0)::int as sponsor_cents,
      count(distinct case when c.support_type = 'fan' then c.supporter_id end)::int as supporter_count,
      count(distinct case when c.support_type = 'business' then c.sponsor_id end)::int as sponsor_count,
      max(cp.goal_cents)::int as goal_cents
    from ledger_entries l
    join contributions c on c.id = l.contribution_id
    join campaigns cp on cp.id = l.campaign_id
    where l.campaign_id = ${campaignId}
  `);

  const r = (rows as unknown as { rows: Record<string, number>[] }).rows?.[0]
    ?? (rows as unknown as Record<string, number>[])[0];

  const fanCents = Number(r?.fan_cents ?? 0);
  const sponsorCents = Number(r?.sponsor_cents ?? 0);
  const goalCents = Number(r?.goal_cents ?? 0);

  // Sponsorship is tracked separately by default: the PRD's own sponsor
  // figures would put a $25,000 campaign past 150% before a single fan
  // appeared, and one large partner should not make a record look finished.
  const includeSponsorship = await settingOr('meterIncludesSponsorship', false);
  const meterCents = includeSponsorship ? fanCents + sponsorCents : fanCents;

  return {
    fanCents, sponsorCents, meterCents, goalCents,
    percent: fundedPercent(meterCents, goalCents),
    supporterCount: Number(r?.supporter_count ?? 0),
    sponsorCount: Number(r?.sponsor_count ?? 0),
  };
});

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

async function standingsFor(campaignId: string, scope: 'fan' | 'business') {
  const idCol = scope === 'fan' ? sql`c.supporter_id` : sql`c.sponsor_id`;
  const rows = await db.execute(sql`
    select
      ${idCol} as id,
      sum(l.amount_cents)::int as amount_cents,
      max(l.occurred_at) as reached_at,
      bool_or(c.is_anonymous) as is_anonymous,
      bool_or(c.hide_amount) as hide_amount,
      max(c.display_name_snapshot) as snapshot_name,
      ${scope === 'business' ? sql`max(sp.business_name)` : sql`max(su.display_name)`} as live_name,
      ${scope === 'business' ? sql`max(sp.slug)` : sql`null::text`} as slug
    from ledger_entries l
    join contributions c on c.id = l.contribution_id
    ${scope === 'business'
      ? sql`join sponsors sp on sp.id = c.sponsor_id`
      : sql`left join supporters su on su.id = c.supporter_id`}
    where l.campaign_id = ${campaignId}
      and c.support_type = ${scope}
      and c.leaderboard_visible = true
      and c.moderation <> 'hidden'
      and c.moderation <> 'blocked'
      and ${idCol} is not null
    group by ${idCol}
    having sum(l.amount_cents) > 0
  `);
  return ((rows as unknown as { rows: Record<string, unknown>[] }).rows
    ?? (rows as unknown as Record<string, unknown>[])) ?? [];
}

export const getLeaderboard = cache(async (
  campaignId: string,
  scope: 'fan' | 'business',
  limit?: number,
): Promise<{ rows: LeaderboardRowData[]; totalCount: number }> => {
  const raw = await standingsFor(campaignId, scope);

  const standings: Standing[] = raw.map((r) => ({
    id: String(r.id),
    amountCents: Number(r.amount_cents),
    reachedAt: new Date(String(r.reached_at)),
  }));

  const ranked = rankStandings(standings);
  const byId = new Map(raw.map((r) => [String(r.id), r]));

  const rows = ranked.map((entry) => {
    const r = byId.get(entry.id)!;
    const anon = Boolean(r.is_anonymous);
    return {
      id: entry.id,
      rank: entry.rank,
      name: anon ? 'Anonymous' : String(r.snapshot_name ?? r.live_name ?? 'Supporter'),
      amountCents: entry.amountCents,
      isAnonymous: anon,
      hideAmount: Boolean(r.hide_amount),
      slug: r.slug ? String(r.slug) : null,
    } satisfies LeaderboardRowData;
  });

  return { rows: limit ? rows.slice(0, limit) : rows, totalCount: rows.length };
});

/** Powers the outbid panel: what it costs, right now, to take #1. */
export const getTopSpot = cache(async (campaignId: string, scope: 'fan' | 'business') => {
  const { rows, totalCount } = await getLeaderboard(campaignId, scope);
  const leader = rows[0] ?? null;
  const increment = scope === 'business'
    ? await settingOr('minIncrementCents', 50_000)
    : await settingOr('fanIncrementCents', 100);
  const floor = await settingOr('minBidCents', 1_000);
  return {
    leader,
    totalCount,
    incrementCents: increment,
    floorCents: floor,
    minimumToLeadCents: Math.max(floor, (leader?.amountCents ?? 0) + increment),
  };
});
