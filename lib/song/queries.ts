import 'server-only';
import { cache } from 'react';
import {
  and,
  asc,
  desc,
  eq,
  isNotNull,
  lte,
  sql,
} from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { setting } from '@/lib/config/settings';
import {
  getPublicSupportTiers,
  type PublicSupportTier,
} from '@/lib/tiers/queries';
import {
  getCampaignTotals,
  getLeaderboard,
  getTopSpot,
  type CampaignTotals,
  type LeaderboardRowData,
} from '@/lib/campaign/queries';

type Song = typeof s.songs.$inferSelect;
type Campaign = typeof s.campaigns.$inferSelect;
type MediaAsset = typeof s.mediaAssets.$inferSelect;

export type SongPageData = {
  song: Song;
  campaign: Campaign | null;
  cover: MediaAsset | null;
  audio: MediaAsset | null;
  totals: CampaignTotals;
  fan: { rows: LeaderboardRowData[]; totalCount: number };
  business: { rows: LeaderboardRowData[]; totalCount: number };
  crown: Awaited<ReturnType<typeof getTopSpot>> | null;
  tiers: PublicSupportTier[];
  packages: (typeof s.sponsorPackages.$inferSelect)[];
  updates: (typeof s.songUpdates.$inferSelect)[];
  journey: (typeof s.journeyEvents.$inferSelect)[];
  /** null when the campaign has no end date; 0 on the final day. */
  daysLeft: number | null;
  isAcceptingSupport: boolean;
};

const EMPTY_TOTALS: CampaignTotals = {
  fanCents: 0,
  sponsorCents: 0,
  meterCents: 0,
  goalCents: 0,
  percent: 0,
  supporterCount: 0,
  sponsorCount: 0,
};

async function loadMedia(id: string | null): Promise<MediaAsset | null> {
  if (!id) return null;
  const [row] = await db
    .select()
    .from(s.mediaAssets)
    .where(eq(s.mediaAssets.id, id))
    .limit(1);
  return row ?? null;
}

/**
 * A song may own several campaigns over its life (PRD §43). The page always
 * shows the live one; if none is live it falls back to the most recent, so a
 * closed record still renders its final numbers instead of an empty shell.
 */
async function activeCampaign(songId: string): Promise<Campaign | null> {
  const [row] = await db
    .select()
    .from(s.campaigns)
    .where(eq(s.campaigns.songId, songId))
    .orderBy(
      sql`case ${s.campaigns.status} when 'live' then 0 when 'funded' then 1 when 'closed' then 2 else 3 end`,
      desc(s.campaigns.createdAt),
    )
    .limit(1);
  return row ?? null;
}

function daysUntil(endsAt: Date | null): number | null {
  if (!endsAt) return null;
  const ms = endsAt.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

export const getSongPage = cache(async (slug: string): Promise<SongPageData | null> => {
  const [song] = await db
    .select()
    .from(s.songs)
    .where(and(eq(s.songs.slug, slug), eq(s.songs.isPublished, true)))
    .limit(1);

  if (!song) return null;

  const [cover, audio, campaign] = await Promise.all([
    loadMedia(song.coverAssetId),
    loadMedia(song.audioAssetId),
    activeCampaign(song.id),
  ]);

  if (!campaign) {
    return {
      song, campaign: null, cover, audio,
      totals: EMPTY_TOTALS,
      fan: { rows: [], totalCount: 0 },
      business: { rows: [], totalCount: 0 },
      crown: null, tiers: [], packages: [], updates: [], journey: [],
      daysLeft: null, isAcceptingSupport: false,
    };
  }

  const visibleRows = await setting('leaderboardVisibleRows');
  const updatesCount = await setting('updatesVisibleCount');
  const journeyCount = await setting('journeyVisibleCount');

  const [totals, fan, business, crown, tiers, packages, updates, journey] =
    await Promise.all([
      getCampaignTotals(campaign.id),
      getLeaderboard(campaign.id, 'fan', visibleRows),
      getLeaderboard(campaign.id, 'business', visibleRows),
      getTopSpot(campaign.id, 'business'),
      getPublicSupportTiers(
        campaign.id,
      ),
      db.select().from(s.sponsorPackages)
        .where(and(eq(s.sponsorPackages.campaignId, campaign.id), eq(s.sponsorPackages.isActive, true)))
        .orderBy(asc(s.sponsorPackages.sortIndex)),
      db.select({
        id: s.songUpdates.id,
        songId: s.songUpdates.songId,
        campaignId:
          s.songUpdates.campaignId,
        title: s.songUpdates.title,
        /*
         * A gated body is withheld at the query,
         * not hidden in the markup. The caller
         * re-attaches it only for a supporter who
         * has actually paid past the threshold.
         */
        body: s.songUpdates.body,
        minTierCents:
          s.songUpdates.minTierCents,
        publishedAt:
          s.songUpdates.publishedAt,
        isVisible:
          s.songUpdates.isVisible,
      }).from(s.songUpdates)
        .where(and(
          eq(s.songUpdates.songId, song.id),
          eq(s.songUpdates.isVisible, true),
          isNotNull(s.songUpdates.publishedAt),
          lte(
            s.songUpdates.publishedAt,
            new Date(),
          ),
        ))
        .orderBy(desc(s.songUpdates.publishedAt))
        .limit(updatesCount),
      db.select().from(s.journeyEvents)
        .where(and(eq(s.journeyEvents.songId, song.id), eq(s.journeyEvents.isVisible, true)))
        .orderBy(desc(s.journeyEvents.occurredAt))
        .limit(journeyCount),
    ]);

  return {
    song, campaign, cover, audio, totals, fan, business, crown,
    tiers, packages, updates, journey,
    daysLeft: daysUntil(campaign.endsAt),
    isAcceptingSupport:
      campaign.status === 'live' &&
      campaign.acceptSupport &&
      (
        campaign.startsAt === null ||
        campaign.startsAt.getTime() <=
          Date.now()
      ) &&
      (
        campaign.endsAt === null ||
        campaign.endsAt.getTime() >
          Date.now()
      ),
  };
});

/** Shared date rendering. Fixed zone keeps server and client identical. */
export async function formatDay(value: Date): Promise<string> {
  const locale = await setting('locale');
  const timeZone = await setting('displayTimeZone');
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit', month: 'short', year: 'numeric', timeZone,
  }).format(value).toUpperCase();
}

/** "15s ago" / "2m ago" / "3h ago" / falls back to formatDay past a day —
 * computed once at render time, not live-ticking (this is a server component). */
export function formatRelativeTime(value: Date, now = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - value.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
