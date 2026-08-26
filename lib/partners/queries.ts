import 'server-only';
import { cache } from 'react';
import { and, desc, eq, sql } from 'drizzle-orm';
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
};

export type SponsorPackage = typeof s.sponsorPackages.$inferSelect;

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
};

export const getPartnersPage = cache(async (): Promise<PartnersPageData> => {
  const [acceptingRows, totalRows, packages, sponsorRows] = await Promise.all([
    db.execute(sql`
      select cp.id as campaign_id, cp.slug as campaign_slug,
        so.title as song_title, so.slug as song_slug
      from campaigns cp
      join songs so on so.id = cp.song_id
      where cp.status = 'live' and cp.business_sponsorship_enabled = true
      order by cp.created_at desc
    `),
    db.execute(sql`
      select sum(l.amount_cents)::int as cents
      from ledger_entries l
      join contributions c on c.id = l.contribution_id
      where c.support_type = 'business'
    `),
    db
      .select()
      .from(s.sponsorPackages)
      .where(eq(s.sponsorPackages.isActive, true))
      .orderBy(s.sponsorPackages.sortIndex),
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
      };
    }),
  );

  const totalSponsorCents = Number(
    ((totalRows as unknown as { rows: Record<string, unknown>[] }).rows[0]?.cents as number) ?? 0,
  );

  return {
    accepting,
    packages,
    sponsors: sponsorRows,
    totalSponsorCents,
    totalSponsorCount: sponsorRows.length,
  };
});
