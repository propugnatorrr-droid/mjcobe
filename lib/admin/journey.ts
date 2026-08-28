import 'server-only';

import {
  asc,
  desc,
  eq,
} from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import type {
  JourneyEventKind,
} from '@/lib/journey/kinds';

export type AdminJourneyEvent = {
  id: string;
  songId: string | null;
  songTitle: string | null;
  songSlug: string | null;
  campaignId: string | null;
  campaignName: string | null;
  kind: JourneyEventKind;
  title: string;
  body: string | null;
  mediaAssetId: string | null;
  imagePath: string | null;
  occurredAt: Date;
  isAuto: boolean;
  isVisible: boolean;
  createdAt: Date;
};

export type JourneyAdminOption = {
  value: string;
  label: string;
};

export type JourneyAdminData = {
  events: AdminJourneyEvent[];
  songs: JourneyAdminOption[];
  campaigns: JourneyAdminOption[];
  images: JourneyAdminOption[];
};

async function listJourneyEventsAdmin():
Promise<AdminJourneyEvent[]> {
  return db
    .select({
      id: s.journeyEvents.id,
      songId: s.journeyEvents.songId,
      songTitle: s.songs.title,
      songSlug: s.songs.slug,
      campaignId:
        s.journeyEvents.campaignId,
      campaignName: s.campaigns.name,
      kind: s.journeyEvents.kind,
      title: s.journeyEvents.title,
      body: s.journeyEvents.body,
      mediaAssetId:
        s.journeyEvents.mediaAssetId,
      imagePath: s.mediaAssets.path,
      occurredAt:
        s.journeyEvents.occurredAt,
      isAuto: s.journeyEvents.isAuto,
      isVisible:
        s.journeyEvents.isVisible,
      createdAt:
        s.journeyEvents.createdAt,
    })
    .from(s.journeyEvents)
    .leftJoin(
      s.songs,
      eq(
        s.songs.id,
        s.journeyEvents.songId,
      ),
    )
    .leftJoin(
      s.campaigns,
      eq(
        s.campaigns.id,
        s.journeyEvents.campaignId,
      ),
    )
    .leftJoin(
      s.mediaAssets,
      eq(
        s.mediaAssets.id,
        s.journeyEvents.mediaAssetId,
      ),
    )
    .orderBy(
      desc(s.journeyEvents.occurredAt),
      desc(s.journeyEvents.createdAt),
    )
    .limit(200);
}

async function listJourneySongs():
Promise<JourneyAdminOption[]> {
  const rows = await db
    .select({
      id: s.songs.id,
      title: s.songs.title,
    })
    .from(s.songs)
    .orderBy(asc(s.songs.title));

  return rows.map((song) => ({
    value: song.id,
    label: song.title,
  }));
}

async function listJourneyCampaigns():
Promise<JourneyAdminOption[]> {
  const rows = await db
    .select({
      id: s.campaigns.id,
      name: s.campaigns.name,
      songTitle: s.songs.title,
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
    );

  return rows.map((campaign) => ({
    value: campaign.id,
    label:
      `${campaign.songTitle} — ${campaign.name}`,
  }));
}

async function listJourneyImages():
Promise<JourneyAdminOption[]> {
  const rows = await db
    .select({
      id: s.mediaAssets.id,
      role: s.mediaAssets.role,
      path: s.mediaAssets.path,
    })
    .from(s.mediaAssets)
    .where(
      eq(s.mediaAssets.kind, 'image'),
    )
    .orderBy(
      desc(s.mediaAssets.createdAt),
    )
    .limit(200);

  return rows.map((image) => ({
    value: image.id,
    label: `${image.role} — ${image.path}`,
  }));
}

export async function getJourneyAdminData():
Promise<JourneyAdminData> {
  const [
    events,
    songs,
    campaigns,
    images,
  ] = await Promise.all([
    listJourneyEventsAdmin(),
    listJourneySongs(),
    listJourneyCampaigns(),
    listJourneyImages(),
  ]);

  return {
    events,
    songs,
    campaigns,
    images,
  };
}
