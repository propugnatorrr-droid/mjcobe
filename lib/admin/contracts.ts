import 'server-only';

import {
  asc,
  desc,
  eq,
} from 'drizzle-orm';
import {
  db,
} from '@/lib/db/client';
import * as s from '@/lib/db/schema';

export type AdminContractRow =
  typeof s.contracts.$inferSelect & {
    campaignName:
      string | null;
    songTitle:
      string | null;
  };

export type ContractCampaignOption = {
  id: string;
  name: string;
  songTitle: string;
};

export async function getSponsorContracts(
  sponsorId: string,
): Promise<{
  contracts:
    AdminContractRow[];
  campaigns:
    ContractCampaignOption[];
}> {
  const [
    contractRows,
    campaignRows,
  ] = await Promise.all([
    db
      .select({
        id: s.contracts.id,
        sponsorId:
          s.contracts.sponsorId,
        campaignId:
          s.contracts.campaignId,
        pdfPath:
          s.contracts.pdfPath,
        signedAt:
          s.contracts.signedAt,
        createdAt:
          s.contracts.createdAt,
        campaignName:
          s.campaigns.name,
        songTitle:
          s.songs.title,
      })
      .from(s.contracts)
      .leftJoin(
        s.campaigns,
        eq(
          s.campaigns.id,
          s.contracts.campaignId,
        ),
      )
      .leftJoin(
        s.songs,
        eq(
          s.songs.id,
          s.campaigns.songId,
        ),
      )
      .where(
        eq(
          s.contracts.sponsorId,
          sponsorId,
        ),
      )
      .orderBy(
        desc(
          s.contracts.createdAt,
        ),
      ),

    db
      .select({
        id: s.campaigns.id,
        name: s.campaigns.name,
        songTitle:
          s.songs.title,
      })
      .from(s.campaigns)
      .innerJoin(
        s.songs,
        eq(
          s.songs.id,
          s.campaigns.songId,
        ),
      )
      .orderBy(
        asc(s.songs.title),
        asc(s.campaigns.name),
      ),
  ]);

  return {
    contracts:
      contractRows,
    campaigns:
      campaignRows,
  };
}
