import 'server-only';
import { desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';

type Row = Record<string, unknown>;
const rows = (result: unknown): Row[] => (result as { rows: Row[] }).rows ?? [];
const num = (v: unknown): number => Number(v ?? 0);

export type Overview = {
  totalCents: number;
  todayCents: number;
  weekCents: number;
  monthCents: number;
  supporterCount: number;
  sponsorCount: number;
  topSong: { title: string; cents: number } | null;
  pendingSponsorCount: number;
};

export async function getOverview(): Promise<Overview> {
  const [totals] = rows(
    await db.execute(sql`
      select
        coalesce(sum(amount_cents), 0)::int as total_cents,
        coalesce(sum(case when occurred_at >= now() - interval '1 day' then amount_cents end), 0)::int as today_cents,
        coalesce(sum(case when occurred_at >= now() - interval '7 days' then amount_cents end), 0)::int as week_cents,
        coalesce(sum(case when occurred_at >= now() - interval '30 days' then amount_cents end), 0)::int as month_cents,
        count(distinct supporter_id)::int as supporter_count,
        count(distinct sponsor_id)::int as sponsor_count
      from ledger_entries
    `),
  );

  const [top] = rows(
    await db.execute(sql`
      select so.title, coalesce(sum(l.amount_cents), 0)::int as cents
      from ledger_entries l
      join campaigns c on c.id = l.campaign_id
      join songs so on so.id = c.song_id
      group by so.title
      order by cents desc
      limit 1
    `),
  );

  // A business contribution with no ledger entry is money authorized but held.
  const [pending] = rows(
    await db.execute(sql`
      select count(*)::int as n
      from contributions c
      left join ledger_entries l on l.contribution_id = c.id
      where c.support_type = 'business' and l.id is null
    `),
  );

  return {
    totalCents: num(totals?.total_cents),
    todayCents: num(totals?.today_cents),
    weekCents: num(totals?.week_cents),
    monthCents: num(totals?.month_cents),
    supporterCount: num(totals?.supporter_count),
    sponsorCount: num(totals?.sponsor_count),
    topSong: top ? { title: String(top.title), cents: num(top.cents) } : null,
    pendingSponsorCount: num(pending?.n),
  };
}

/** Real daily totals for the last N days — not a fabricated trend line. */
export async function getDailyTotals(days = 14): Promise<{ day: string; cents: number }[]> {
  const result = await db.execute(sql`
    select to_char(d.day, 'Mon DD') as day, coalesce(sum(l.amount_cents), 0)::int as cents
    from generate_series(current_date - (${days}::int - 1), current_date, interval '1 day') as d(day)
    left join ledger_entries l on l.occurred_at::date = d.day
    group by d.day
    order by d.day
  `);
  return rows(result).map((r) => ({ day: String(r.day), cents: num(r.cents) }));
}

export type ContributionRow = {
  contributionId: string;
  transactionId: string | null;
  occurredAt: Date;
  name: string;
  supportType: 'fan' | 'business';
  amountCents: number;
  netCents: number;
  songTitle: string;
  songSlug: string;
  state: string;
  moderation: string;
  leaderboardVisible: boolean;
  isAnonymous: boolean;
  email: string | null;
};

export async function listContributions(filter?: {
  moderation?: string;
  supportType?: string;
}): Promise<ContributionRow[]> {
  const result = await db.execute(sql`
    select
      c.id as contribution_id,
      t.id as transaction_id,
      c.created_at as occurred_at,
      coalesce(sp.business_name, c.display_name_snapshot, su.display_name, '') as name,
      c.support_type,
      c.amount_cents,
      coalesce((select sum(l.amount_cents) from ledger_entries l where l.contribution_id = c.id), 0)::int as net_cents,
      so.title as song_title,
      so.slug as song_slug,
      coalesce(t.state::text, 'initiated') as state,
      c.moderation::text as moderation,
      c.leaderboard_visible,
      c.is_anonymous,
      coalesce(sp.email, su.email) as email
    from contributions c
    join songs so on so.id = c.song_id
    left join transactions t on t.contribution_id = c.id
    left join supporters su on su.id = c.supporter_id
    left join sponsors sp on sp.id = c.sponsor_id
    where (${filter?.moderation ?? null}::text is null or c.moderation::text = ${filter?.moderation ?? null})
      and (${filter?.supportType ?? null}::text is null or c.support_type::text = ${filter?.supportType ?? null})
    order by c.created_at desc
    limit 100
  `);

  return rows(result).map((r) => ({
    contributionId: String(r.contribution_id),
    transactionId: r.transaction_id ? String(r.transaction_id) : null,
    occurredAt: new Date(String(r.occurred_at)),
    name: String(r.name ?? ''),
    supportType: r.support_type as 'fan' | 'business',
    amountCents: num(r.amount_cents),
    netCents: num(r.net_cents),
    songTitle: String(r.song_title),
    songSlug: String(r.song_slug),
    state: String(r.state),
    moderation: String(r.moderation),
    leaderboardVisible: Boolean(r.leaderboard_visible),
    isAnonymous: Boolean(r.is_anonymous),
    email: r.email ? String(r.email) : null,
  }));
}

export type PendingSponsor = {
  contributionId: string;
  transactionId: string | null;
  sponsorId: string | null;
  businessName: string;
  repName: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  industry: string | null;
  message: string | null;
  amountCents: number;
  songTitle: string;
  songSlug: string;
  submittedAt: Date;
};

export async function listPendingSponsors(): Promise<PendingSponsor[]> {
  const result = await db.execute(sql`
    select
      c.id as contribution_id,
      t.id as transaction_id,
      sp.id as sponsor_id,
      coalesce(sp.business_name, '') as business_name,
      sp.rep_name, sp.email, sp.website, sp.instagram, sp.industry, sp.message,
      c.amount_cents, c.created_at as submitted_at,
      so.title as song_title, so.slug as song_slug
    from contributions c
    join songs so on so.id = c.song_id
    left join transactions t on t.contribution_id = c.id
    left join sponsors sp on sp.id = c.sponsor_id
    left join ledger_entries l on l.contribution_id = c.id
    where c.support_type = 'business' and l.id is null
    order by c.created_at asc
  `);

  return rows(result).map((r) => ({
    contributionId: String(r.contribution_id),
    transactionId: r.transaction_id ? String(r.transaction_id) : null,
    sponsorId: r.sponsor_id ? String(r.sponsor_id) : null,
    businessName: String(r.business_name),
    repName: r.rep_name ? String(r.rep_name) : null,
    email: r.email ? String(r.email) : null,
    website: r.website ? String(r.website) : null,
    instagram: r.instagram ? String(r.instagram) : null,
    industry: r.industry ? String(r.industry) : null,
    message: r.message ? String(r.message) : null,
    amountCents: num(r.amount_cents),
    songTitle: String(r.song_title),
    songSlug: String(r.song_slug),
    submittedAt: new Date(String(r.submitted_at)),
  }));
}

export async function listRecentTransactions(limit = 10) {
  const result = await db.execute(sql`
    select t.id, t.state::text as state, t.amount_cents, t.created_at,
           so.title as song_title
    from transactions t
    join contributions c on c.id = t.contribution_id
    join songs so on so.id = c.song_id
    order by t.created_at desc
    limit ${limit}
  `);
  return rows(result).map((r) => ({
    id: String(r.id),
    state: String(r.state),
    amountCents: num(r.amount_cents),
    createdAt: new Date(String(r.created_at)),
    songTitle: String(r.song_title),
  }));
}

export async function listSettings() {
  return db.select().from(s.settings).orderBy(s.settings.key);
}

export async function listSiteCopy() {
  return db.select().from(s.siteCopy).orderBy(s.siteCopy.key);
}

export async function listAudit(limit = 100) {
  return db
    .select({
      id: s.auditLog.id,
      action: s.auditLog.action,
      entity: s.auditLog.entity,
      entityId: s.auditLog.entityId,
      reason: s.auditLog.reason,
      createdAt: s.auditLog.createdAt,
      adminEmail: s.adminUsers.email,
    })
    .from(s.auditLog)
    .leftJoin(s.adminUsers, eq(s.adminUsers.id, s.auditLog.adminUserId))
    .orderBy(desc(s.auditLog.createdAt))
    .limit(limit);
}

export async function listAllCampaigns() {
  return db
    .select({
      campaignId: s.campaigns.id,
      songId: s.songs.id,
      // campaigns.name already reads e.g. "SONG TITLE — Release Campaign"
      // (see seed.ts) — do not prefix the song title again here.
      label: s.campaigns.name,
    })
    .from(s.campaigns)
    .innerJoin(s.songs, eq(s.songs.id, s.campaigns.songId))
    .orderBy(desc(s.campaigns.createdAt));
}

export async function listBlocklist() {
  return db.select().from(s.blocklist).orderBy(desc(s.blocklist.createdAt));
}

export async function hasUnsettledLedger(contributionId: string) {
  const [row] = await db
    .select({ id: s.ledgerEntries.id })
    .from(s.ledgerEntries)
    .where(eq(s.ledgerEntries.contributionId, contributionId))
    .limit(1);
  return !row;
}

export { isNull };
