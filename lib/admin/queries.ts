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

  /*
   * Sponsorship settles automatically. The only
   * sponsor work queue is now the flagged
   * exception queue.
   */
  const [pending] = rows(
    await db.execute(sql`
      select count(
        distinct c.id
      )::int as n
      from contributions c
      left join sponsors sp
        on sp.id = c.sponsor_id
      where
        c.support_type =
          'business'
        and (
          c.moderation =
            'flagged'
          or sp.moderation =
            'flagged'
        )
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
  sponsorId: string | null;
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
      c.sponsor_id,
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
    transactionId:
      r.transaction_id
        ? String(
            r.transaction_id,
          )
        : null,
    sponsorId:
      r.sponsor_id
        ? String(r.sponsor_id)
        : null,
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
export type AdminSponsor = {
  id: string;
  slug: string;
  businessName: string;
  repName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  shopUrl: string | null;
  industry: string | null;
  description: string | null;
  message: string | null;
logoPath: string | null;
pendingLogoAssetId: string | null;
pendingLogoPath: string | null;
  moderation: string;
  approvedAt: Date | null;
  supportedSince: Date | null;
  createdAt: Date;
  contributionCount: number;
  netCents: number;
};

function adminSponsorFromRow(
  row: Row,
): AdminSponsor {
  return {
    id: String(row.id),
    slug: String(row.slug),
    businessName: String(
      row.business_name ?? '',
    ),
    repName: row.rep_name
      ? String(row.rep_name)
      : null,
    email: row.email
      ? String(row.email)
      : null,
    phone: row.phone
      ? String(row.phone)
      : null,
    website: row.website
      ? String(row.website)
      : null,
    instagram: row.instagram
      ? String(row.instagram)
      : null,
    shopUrl: row.shop_url
      ? String(row.shop_url)
      : null,
    industry: row.industry
      ? String(row.industry)
      : null,
    description: row.description
      ? String(row.description)
      : null,
    message: row.message
      ? String(row.message)
      : null,
logoPath: row.logo_path
  ? String(row.logo_path)
  : null,
pendingLogoAssetId:
  row.pending_logo_asset_id
    ? String(
        row.pending_logo_asset_id,
      )
    : null,
pendingLogoPath:
  row.pending_logo_path
    ? String(row.pending_logo_path)
    : null,
    moderation: String(row.moderation),
    approvedAt: row.approved_at
      ? new Date(String(row.approved_at))
      : null,
    supportedSince: row.supported_since
      ? new Date(String(row.supported_since))
      : null,
    createdAt: new Date(
      String(row.created_at),
    ),
    contributionCount: num(
      row.contribution_count,
    ),
    netCents: num(row.net_cents),
  };
}

export async function listAdminSponsors(): Promise<
  AdminSponsor[]
> {
  const result =
    await db.execute(sql`
      with contribution_balances as (
        select
          c.id,
          c.sponsor_id,
          coalesce(
            sum(
              l.amount_cents
            ),
            0
          )::int as net_cents
        from contributions c
        left join ledger_entries l
          on l.contribution_id =
            c.id
        where
          c.support_type =
            'business'
          and c.is_test =
            false
        group by
          c.id,
          c.sponsor_id
      )
      select
        sp.id,
        sp.slug,
        sp.business_name,
        sp.rep_name,
        sp.email,
        sp.phone,
        sp.website,
        sp.instagram,
        sp.shop_url,
        sp.industry,
        sp.description,
        sp.message,
        sp.moderation::text
          as moderation,
        sp.approved_at,
        sp.supported_since,
        sp.created_at,
        ma.path
          as logo_path,
        pma.id
          as pending_logo_asset_id,
        pma.path
          as pending_logo_path,
        count(
          distinct cb.id
        ) filter (
          where
            cb.net_cents > 0
        )::int
          as contribution_count,
        coalesce(
          sum(
            greatest(
              cb.net_cents,
              0
            )
          ),
          0
        )::int
          as net_cents
      from sponsors sp
      left join media_assets ma
        on ma.id =
          sp.logo_asset_id
      left join lateral (
        select
          pending.id,
          pending.path
        from media_assets pending
        where
          pending.role =
            'sponsor-logo-pending'
          and pending.derivatives
            ->> 'pendingSponsorId'
            = sp.id::text
        order by
          pending.created_at
            desc
        limit 1
      ) pma on true
      left join contribution_balances cb
        on cb.sponsor_id =
          sp.id
      group by
        sp.id,
        ma.path,
        pma.id,
        pma.path
      order by
        case sp.moderation
          when 'approved'
            then 0
          when 'pending'
            then 1
          when 'flagged'
            then 2
          when 'hidden'
            then 3
          else 4
        end,
        net_cents desc,
        sp.created_at desc
    `);

  return rows(
    result,
  ).map(
    adminSponsorFromRow,
  );
}


export async function getAdminSponsor(
  id: string,
): Promise<AdminSponsor | null> {
  const result =
    await db.execute(sql`
      with contribution_balances as (
        select
          c.id,
          c.sponsor_id,
          coalesce(
            sum(
              l.amount_cents
            ),
            0
          )::int as net_cents
        from contributions c
        left join ledger_entries l
          on l.contribution_id =
            c.id
        where
          c.support_type =
            'business'
          and c.is_test =
            false
        group by
          c.id,
          c.sponsor_id
      )
      select
        sp.id,
        sp.slug,
        sp.business_name,
        sp.rep_name,
        sp.email,
        sp.phone,
        sp.website,
        sp.instagram,
        sp.shop_url,
        sp.industry,
        sp.description,
        sp.message,
        sp.moderation::text
          as moderation,
        sp.approved_at,
        sp.supported_since,
        sp.created_at,
        ma.path
          as logo_path,
        pma.id
          as pending_logo_asset_id,
        pma.path
          as pending_logo_path,
        count(
          distinct cb.id
        ) filter (
          where
            cb.net_cents > 0
        )::int
          as contribution_count,
        coalesce(
          sum(
            greatest(
              cb.net_cents,
              0
            )
          ),
          0
        )::int
          as net_cents
      from sponsors sp
      left join media_assets ma
        on ma.id =
          sp.logo_asset_id
      left join lateral (
        select
          pending.id,
          pending.path
        from media_assets pending
        where
          pending.role =
            'sponsor-logo-pending'
          and pending.derivatives
            ->> 'pendingSponsorId'
            = sp.id::text
        order by
          pending.created_at
            desc
        limit 1
      ) pma on true
      left join contribution_balances cb
        on cb.sponsor_id =
          sp.id
      where
        sp.id = ${id}
      group by
        sp.id,
        ma.path,
        pma.id,
        pma.path
      limit 1
    `);

  const row =
    rows(result)[0];

  return row
    ? adminSponsorFromRow(
        row,
      )
    : null;
}


export type PendingSponsor = {
  contributionId: string;
  transactionId: string | null;
  transactionState: string;
  sponsorId: string | null;
  businessName: string;
  repName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  industry: string | null;
  message: string | null;
  logoPath: string | null;
  amountCents: number;
  songTitle: string;
  songSlug: string;
  submittedAt: Date;
};

export async function listPendingSponsors(): Promise<
  PendingSponsor[]
> {
  const result = await db.execute(sql`
    select
      c.id as contribution_id,
      t.id as transaction_id,
      coalesce(t.state::text, 'initiated') as transaction_state,
      sp.id as sponsor_id,
      coalesce(sp.business_name, '') as business_name,
      sp.rep_name,
      sp.email,
      sp.phone,
      sp.website,
      sp.instagram,
      sp.industry,
      sp.message,
ma.path as logo_path,
pma.id as pending_logo_asset_id,
pma.path as pending_logo_path,
      c.amount_cents,
      c.created_at as submitted_at,
      so.title as song_title,
      so.slug as song_slug
    from contributions c
    join songs so
      on so.id = c.song_id
    left join transactions t
      on t.contribution_id = c.id
    left join sponsors sp
      on sp.id = c.sponsor_id
left join media_assets ma
  on ma.id = sp.logo_asset_id
left join lateral (
  select
    pending.id,
    pending.path
  from media_assets pending
  where
    pending.role =
      'sponsor-logo-pending'
    and
    pending.derivatives
      ->> 'pendingSponsorId'
      = sp.id::text
  order by pending.created_at desc
  limit 1
) pma on true
    left join ledger_entries l
      on l.contribution_id = c.id
    where c.support_type = 'business'
      and l.id is null
      and c.moderation not in ('blocked', 'hidden')
      and (
        t.state is null
        or t.state in ('initiated', 'authorized')
      )
    order by c.created_at asc
  `);

  return rows(result).map((row) => ({
    contributionId: String(row.contribution_id),
    transactionId: row.transaction_id
      ? String(row.transaction_id)
      : null,
    transactionState: String(
      row.transaction_state,
    ),
    sponsorId: row.sponsor_id
      ? String(row.sponsor_id)
      : null,
    businessName: String(row.business_name),
    repName: row.rep_name
      ? String(row.rep_name)
      : null,
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    website: row.website
      ? String(row.website)
      : null,
    instagram: row.instagram
      ? String(row.instagram)
      : null,
    industry: row.industry
      ? String(row.industry)
      : null,
    message: row.message
      ? String(row.message)
      : null,
    logoPath: row.logo_path
      ? String(row.logo_path)
      : null,
    amountCents: num(row.amount_cents),
    songTitle: String(row.song_title),
    songSlug: String(row.song_slug),
    submittedAt: new Date(
      String(row.submitted_at),
    ),
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
export type AdminNotification = {
  id: string;
  kind: string;
  recipientEmail: string | null;
  deliveryStatus: string;
  attemptCount: number;
  providerMessageId: string | null;
  lastError: string | null;
  scheduledAt: Date;
  createdAt: Date;
  updatedAt: Date;
  sentAt: Date | null;
};

export async function listNotifications(
  limit = 100,
): Promise<AdminNotification[]> {
  return db
    .select({
      id:
        s.notifications.id,
      kind:
        s.notifications.kind,
      recipientEmail:
        s.notifications.recipientEmail,
      deliveryStatus:
        s.notifications.deliveryStatus,
      attemptCount:
        s.notifications.attemptCount,
      providerMessageId:
        s.notifications.providerMessageId,
      lastError:
        s.notifications.lastError,
      scheduledAt:
        s.notifications.scheduledAt,
      createdAt:
        s.notifications.createdAt,
      updatedAt:
        s.notifications.updatedAt,
      sentAt:
        s.notifications.sentAt,
    })
    .from(s.notifications)
    .orderBy(
      desc(
        s.notifications.createdAt,
      ),
    )
    .limit(limit);
}
