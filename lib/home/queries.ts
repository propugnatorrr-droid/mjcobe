import 'server-only';
import { cache } from 'react';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { listCatalog, type CatalogSong } from '@/lib/catalog/queries';
import {
  getLeaderboard,
  type LeaderboardRowData,
} from '@/lib/campaign/queries';
import { getGlobalJourney, type JourneyEntry } from '@/lib/journey/queries';
import { getPartnersPage, type PartnerSponsor } from '@/lib/partners/queries';
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

/** Newest live campaign's song id — the documented deterministic fallback
 * used when no featured campaign is configured, or the configured one no
 * longer qualifies. Ordered by the campaign's own creation date, never by
 * catalog/sort_index position. */
const getNewestLiveCampaignSongId = cache(
  async (): Promise<string | null> => {
    const result = await db.execute(sql`
      select so.id
      from campaigns cp
      join songs so on so.id = cp.song_id
      where cp.status = 'live'
        and cp.accept_support = true
        and so.is_published = true
      order by cp.created_at desc
      limit 1
    `);

    const row = (result as unknown as { rows: Record<string, unknown>[] })
      .rows[0];

    return row ? String(row.id) : null;
  },
);

function eligibleAsFeatured(song: CatalogSong) {
  return (
    song.campaignId !== null &&
    (song.status === 'building' || song.status === 'coming_soon')
  );
}

/** Never `catalog.find((s) => s.status === 'building')` as the primary
 * pick — that reads as "whichever building song happens to sort first."
 * Order: admin-configured campaign -> newest live campaign -> first
 * eligible catalog row, in that order, and every step is documented.
 *
 * Exported so every "what's the record to back right now" surface (home,
 * /now) picks the same one — a page-specific `catalog.find(...)` copy of
 * this same idea is exactly the bug this replaced. */
export async function resolveFeaturedCampaign(
  catalog: CatalogSong[],
): Promise<CatalogSong | null> {
  const configuredCampaignId = await setting('homeFeaturedCampaignId');

  if (configuredCampaignId) {
    const configured = catalog.find(
      (song) =>
        song.campaignId === configuredCampaignId &&
        eligibleAsFeatured(song),
    );

    if (configured) return configured;
  }

  const fallbackSongId = await getNewestLiveCampaignSongId();

  if (fallbackSongId) {
    const fallback = catalog.find((song) => song.id === fallbackSongId);

    if (fallback && eligibleAsFeatured(fallback)) return fallback;
  }

  return catalog.find(eligibleAsFeatured) ?? null;
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
        (song) => song.status === 'building' && song.id !== featured?.id,
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
        journeyLimit > 0 ? (journeyEntries[0] ?? null) : null,
      partners: partnersPage.sponsors.slice(0, partnersLimit),
    };
  },
);
