import 'server-only';
import { cache } from 'react';
import { listCatalog, type CatalogSong } from '@/lib/catalog/queries';
import {
  getLeaderboard,
  type LeaderboardRowData,
} from '@/lib/campaign/queries';
import {
  getGlobalJourney,
  type JourneyEntry,
} from '@/lib/journey/queries';
import {
  getPartnersPage,
  type PartnerSponsor,
} from '@/lib/partners/queries';
import { setting } from '@/lib/config/settings';

export type HomeComposition = {
  featured: CatalogSong | null;
  topFan: LeaderboardRowData | null;
  topSponsor: LeaderboardRowData | null;
  buildingSongs: CatalogSong[];
  releasedSongs: CatalogSong[];
  latestJourney: JourneyEntry | null;
  partners: PartnerSponsor[];
};

function eligibleAsFeatured(song: CatalogSong) {
  return (
    song.campaignId !== null &&
    (song.status === 'building' || song.status === 'coming_soon')
  );
}

/**
 * Homepage promotion is an editorial decision.
 *
 * Never silently select the first or newest campaign. If the configured
 * campaign is missing, unpublished, closed, or otherwise ineligible, return
 * null so the public page does not promote the wrong record.
 */
export async function resolveFeaturedCampaign(
  catalog: CatalogSong[],
): Promise<CatalogSong | null> {
  const configuredCampaignId = await setting('homeFeaturedCampaignId');

  if (!configuredCampaignId) {
    return null;
  }

  return (
    catalog.find(
      (song) =>
        song.campaignId === configuredCampaignId &&
        eligibleAsFeatured(song),
    ) ?? null
  );
}

export const getHomeComposition = cache(
  async (): Promise<HomeComposition> => {
    const catalog = await listCatalog();
    const featured = await resolveFeaturedCampaign(catalog);

    const [
      leaderboards,
      journeyEntries,
      partnersPage,
      buildingLimit,
      releasedLimit,
      journeyLimit,
      partnersLimit,
    ] = await Promise.all([
      featured?.campaignId
        ? Promise.all([
            getLeaderboard(featured.campaignId, 'fan', 1),
            getLeaderboard(featured.campaignId, 'business', 1),
          ])
        : Promise.resolve([null, null] as const),
      getGlobalJourney(),
      getPartnersPage(),
      setting('homeBuildingLimit'),
      setting('homeReleasedLimit'),
      setting('homeJourneyLimit'),
      setting('homePartnersLimit'),
    ]);

    const [fanLeaderboard, sponsorLeaderboard] = leaderboards;

    const buildingSongs = catalog
      .filter(
        (song) =>
          song.status === 'building' &&
          song.id !== featured?.id,
      )
      .slice(0, buildingLimit);

    const releasedSongs = catalog
      .filter((song) => song.status === 'released')
      .slice(0, releasedLimit);

    return {
      featured,
      topFan: fanLeaderboard?.rows[0] ?? null,
      topSponsor: sponsorLeaderboard?.rows[0] ?? null,
      buildingSongs,
      releasedSongs,
      latestJourney:
        journeyLimit > 0
          ? (journeyEntries[0] ?? null)
          : null,
      partners: partnersPage.sponsors.slice(0, partnersLimit),
    };
  },
);
