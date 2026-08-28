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

export type AdminCampaignRow =
  typeof s.campaigns.$inferSelect;

export type AdminSupportTierRow =
  typeof s.supportTiers.$inferSelect;

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
} | null> {
  const [song] = await db
    .select()
    .from(s.songs)
    .where(eq(s.songs.id, id))
    .limit(1);

  if (!song) {
    return null;
  }

  const campaigns = await db
    .select()
    .from(s.campaigns)
    .where(
      eq(
        s.campaigns.songId,
        id,
      ),
    )
    .orderBy(
      desc(s.campaigns.createdAt),
    );

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
  };
}
