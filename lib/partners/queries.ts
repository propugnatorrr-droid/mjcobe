import 'server-only';
import { cache } from 'react';
import {
  and,
  desc,
  eq,
  getTableColumns,
  sql,
} from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { getCampaignTotals } from '@/lib/campaign/queries';

export type AcceptingCampaign = {
  campaignId: string;
  campaignSlug: string;
  songTitle: string;
  songSlug: string;
  goalCents: number;
  raisedCents: number;
  percent: number;
  coverPath: string | null;
  objective: string | null;
};

export type SponsorPackage =
  typeof s.sponsorPackages.$inferSelect & {
    songSlug: string;
    songTitle: string;
  };

export type PartnerSponsor = {
  id: string;
  slug: string;
  businessName: string;
  logoPath: string | null;
  website: string | null;
  supportedSince: Date | null;
};

export type PartnersPageData = {
  accepting: AcceptingCampaign[];
  packages: SponsorPackage[];
  sponsors: PartnerSponsor[];
  totalSponsorCents: number;
  totalSponsorCount: number;
  totalSupporterCount: number;
  totalSongCount: number;
};

export const getPartnersPage = cache(async (): Promise<PartnersPageData> => {
  const [acceptingRows, totalRows, reachRows, packages, sponsorRows] = await Promise.all([
    db.execute(sql`
      select cp.id as campaign_id, cp.slug as campaign_slug, cp.objective,
        so.title as song_title, so.slug as song_slug, ma.path as cover_path
      from campaigns cp
      join songs so on so.id = cp.song_id
      left join media_assets ma on ma.id = so.cover_asset_id
      where
        cp.status = 'live'
        and cp.accept_support = true
        and cp.business_sponsorship_enabled = true
        and (
          cp.starts_at is null
          or cp.starts_at <= now()
        )
        and (
          cp.ends_at is null
          or cp.ends_at > now()
        )
      order by cp.created_at desc
    `),
    db.execute(sql`
      select sum(l.amount_cents)::int as cents
      from ledger_entries l
      join contributions c on c.id = l.contribution_id
      where c.support_type = 'business'
    `),
    db.execute(sql`
      select
        count(distinct c.supporter_id)::int as supporters,
        count(distinct c.song_id)::int as songs
      from ledger_entries l
      join contributions c on c.id = l.contribution_id
    `),
    db
      .select({
        ...getTableColumns(
          s.sponsorPackages,
        ),
        songSlug:
          s.songs.slug,
        songTitle:
          s.songs.title,
      })
      .from(s.sponsorPackages)
      .innerJoin(
        s.campaigns,
        eq(
          s.campaigns.id,
          s.sponsorPackages
            .campaignId,
        ),
      )
      .innerJoin(
        s.songs,
        eq(
          s.songs.id,
          s.campaigns.songId,
        ),
      )
      .where(
        and(
          eq(
            s.sponsorPackages
              .isActive,
            true,
          ),
          eq(
            s.campaigns.status,
            'live',
          ),
          eq(
            s.campaigns
              .acceptSupport,
            true,
          ),
          eq(
            s.campaigns
              .businessSponsorshipEnabled,
            true,
          ),
          eq(
            s.songs.isPublished,
            true,
          ),
          sql`
            (
              ${s.campaigns.startsAt}
                is null
              or
              ${s.campaigns.startsAt}
                <= now()
            )
          `,
          sql`
            (
              ${s.campaigns.endsAt}
                is null
              or
              ${s.campaigns.endsAt}
                > now()
            )
          `,
        ),
      )
      .orderBy(
        s.sponsorPackages
          .sortIndex,
        s.sponsorPackages
          .priceCents,
      ),

    db
      .select({
        id: s.sponsors.id,
        slug: s.sponsors.slug,
        businessName: s.sponsors.businessName,
        logoPath: s.mediaAssets.path,
        website: s.sponsors.website,
        supportedSince: s.sponsors.supportedSince,
      })
      .from(s.sponsors)
      .leftJoin(s.mediaAssets, eq(s.mediaAssets.id, s.sponsors.logoAssetId))
      .where(and(eq(s.sponsors.moderation, 'approved')))
      .orderBy(desc(s.sponsors.supportedSince)),
  ]);

  const accepting = await Promise.all(
    (acceptingRows as unknown as { rows: Record<string, unknown>[] }).rows.map(async (r) => {
      const campaignId = String(r.campaign_id);
      // Same fan-based meter shown everywhere else on the site — a campaign's
      // "percent funded" must not change depending on which page you're on.
      const totals = await getCampaignTotals(campaignId);
      return {
        campaignId,
        campaignSlug: String(r.campaign_slug),
        songTitle: String(r.song_title),
        songSlug: String(r.song_slug),
        goalCents: totals.goalCents,
        raisedCents: totals.meterCents,
        percent: totals.percent,
        coverPath: r.cover_path ? String(r.cover_path) : null,
        objective: r.objective ? String(r.objective) : null,
      };
    }),
  );

  const totalSponsorCents = Number(
    ((totalRows as unknown as { rows: Record<string, unknown>[] }).rows[0]?.cents as number) ?? 0,
  );

  const reach = (reachRows as unknown as { rows: Record<string, unknown>[] }).rows[0];

  return {
    accepting,
    packages,
    sponsors: sponsorRows,
    totalSponsorCents,
    totalSponsorCount: sponsorRows.length,
    totalSupporterCount: Number(reach?.supporters ?? 0),
    totalSongCount: Number(reach?.songs ?? 0),
  };
});
