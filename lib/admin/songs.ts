import 'server-only';

import {
  asc,
  desc,
  eq,
  inArray,
} from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';

export type AdminSongRow =
  typeof s.songs.$inferSelect;

export type AdminSongUpdateRow =
  typeof s.songUpdates.$inferSelect;

export type AdminCampaignRow =
  typeof s.campaigns.$inferSelect;

export type AdminSupportTierRow =
  typeof s.supportTiers.$inferSelect;

export type AdminMediaAssetRow =
  typeof s.mediaAssets.$inferSelect;

async function mediaAsset(
  id: string | null,
): Promise<AdminMediaAssetRow | null> {
  if (!id) {
    return null;
  }

  const [asset] = await db
    .select()
    .from(s.mediaAssets)
    .where(
      eq(
        s.mediaAssets.id,
        id,
      ),
    )
    .limit(1);

  return asset ?? null;
}

export async function listSongsAdmin():
Promise<AdminSongRow[]> {
  return db
    .select()
    .from(s.songs)
    .orderBy(
      asc(s.songs.sortIndex),
      desc(s.songs.createdAt),
    );
}

export async function getSongAdmin(
  id: string,
): Promise<{
  song: AdminSongRow;
  campaigns: AdminCampaignRow[];
  tiers: AdminSupportTierRow[];
  cover: AdminMediaAssetRow | null;
  audio: AdminMediaAssetRow | null;
  updates: AdminSongUpdateRow[];
} | null> {
  const [song] = await db
    .select()
    .from(s.songs)
    .where(eq(s.songs.id, id))
    .limit(1);

  if (!song) {
    return null;
  }

const [
  campaigns,
  updates,
  cover,
  audio,
] = await Promise.all([
  db
    .select()
    .from(s.campaigns)
    .where(eq(s.campaigns.songId, id))
    .orderBy(desc(s.campaigns.createdAt)),

  db
    .select()
    .from(s.songUpdates)
    .where(eq(s.songUpdates.songId, id))
    .orderBy(
      desc(s.songUpdates.publishedAt),
      desc(s.songUpdates.id),
    ),

  mediaAsset(song.coverAssetId),
  mediaAsset(song.audioAssetId),
]);

  const tiers =
    campaigns.length === 0
      ? []
      : await db
          .select()
          .from(s.supportTiers)
          .where(
            inArray(
              s.supportTiers.campaignId,
              campaigns.map(
                (campaign) =>
                  campaign.id,
              ),
            ),
          )
          .orderBy(
            asc(
              s.supportTiers.sortIndex,
            ),
            asc(
              s.supportTiers.amountCents,
            ),
          );

return {
  song,
  campaigns,
  tiers,
  updates,
  cover,
  audio,
};
}
