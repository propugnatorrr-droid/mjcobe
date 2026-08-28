import 'server-only';
import { cache } from 'react';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { getLeaderboard } from '@/lib/campaign/queries';
import {
  getPublicSupportTiers,
} from '@/lib/tiers/queries';

export type OpenCampaign = {
  campaignId: string;
  songId: string;
  songSlug: string;
  songTitle: string;
  campaignName: string;
  goalCents: number;
  fanSupportEnabled: boolean;
  businessSponsorshipEnabled: boolean;
};

/** Every campaign a visitor may currently pay into. */
export const getOpenCampaigns = cache(async (): Promise<OpenCampaign[]> => {
  const rows = await db
    .select({
      campaignId: s.campaigns.id,
      songId: s.songs.id,
      songSlug: s.songs.slug,
      songTitle: s.songs.title,
      campaignName: s.campaigns.name,
      goalCents: s.campaigns.goalCents,
      fanSupportEnabled: s.campaigns.fanSupportEnabled,
      businessSponsorshipEnabled: s.campaigns.businessSponsorshipEnabled,
      startsAt: s.campaigns.startsAt,
      endsAt: s.campaigns.endsAt,
    })
    .from(s.campaigns)
    .innerJoin(s.songs, eq(s.songs.id, s.campaigns.songId))
    .where(
      and(
        eq(s.campaigns.status, 'live'),
        eq(s.campaigns.acceptSupport, true),
        eq(s.songs.isPublished, true),
      ),
    )
    .orderBy(asc(s.songs.sortIndex), desc(s.campaigns.createdAt));

  const now = Date.now();

  return rows
    .filter(
      (row) =>
        (
          row.startsAt === null ||
          row.startsAt.getTime() <=
            now
        ) &&
        (
          row.endsAt === null ||
          row.endsAt.getTime() >
            now
        ),
    )
    .map(
      ({
        startsAt: _startsAt,
        endsAt: _endsAt,
        ...rest
      }) => rest,
    );
});

export const getTiersFor = cache(
  async (campaignId: string) =>
    getPublicSupportTiers(campaignId),
);

export const getPackagesFor = cache(async (campaignId: string) =>
  db
    .select()
    .from(s.sponsorPackages)
    .where(and(eq(s.sponsorPackages.campaignId, campaignId), eq(s.sponsorPackages.isActive, true)))
    .orderBy(asc(s.sponsorPackages.sortIndex), asc(s.sponsorPackages.priceCents)),
);

/** Rank after settlement, for the confirmation screen. */
export async function rankForIdentity(
  campaignId: string,
  scope: 'fan' | 'business',
  identityId: string | null,
): Promise<number | null> {
  if (!identityId) return null;
  const { rows } = await getLeaderboard(campaignId, scope);
  return rows.find((r) => r.id === identityId)?.rank ?? null;
}
