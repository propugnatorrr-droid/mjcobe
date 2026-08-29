'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  asc,
  desc,
  eq,
} from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { requireAdmin } from '@/lib/admin/guard';
import { recordAudit } from '@/lib/audit/log';

const DEFAULT_GOAL_CENTS = 2_500_000;

const DEFAULT_TIERS = [
  {
    name: 'SUPPORTER',
    amountCents: 1_000,
    description:
      'Join the campaign and be part of the record.',
    benefits: [
      'Name on the supporter wall',
      'Campaign updates',
    ],
    badgeKey: 'supporter',
    sortIndex: 0,
  },
  {
    name: 'DAY ONE',
    amountCents: 2_500,
    description:
      'Support the record from the beginning.',
    benefits: [
      'Everything in Supporter',
      'Day One supporter badge',
      'Early preview access',
    ],
    badgeKey: 'day_one',
    sortIndex: 1,
  },
  {
    name: 'INNER CIRCLE',
    amountCents: 5_000,
    description:
      'Get closer to the record as it takes shape.',
    benefits: [
      'Everything in Day One',
      'Private campaign content',
      'Exclusive downloadable artwork',
    ],
    badgeKey: 'inner_circle',
    sortIndex: 2,
  },
  {
    name: 'GOLD SUPPORTER',
    amountCents: 10_000,
    description:
      'Make a major contribution to the campaign.',
    benefits: [
      'Everything in Inner Circle',
      'Priority supporter-wall placement',
      'Exclusive video content',
    ],
    badgeKey: 'gold',
    sortIndex: 3,
  },
  {
    name: 'FOUNDING SUPPORTER',
    amountCents: 25_000,
    description:
      'Become part of the permanent story of the record.',
    benefits: [
      'Everything in Gold Supporter',
      'Permanent Founding Supporter designation',
      'Premium profile placement',
      'Campaign-page credit',
    ],
    badgeKey: 'founding',
    quantityLimit: 100,
    sortIndex: 4,
  },
  {
    name: 'EXECUTIVE SUPPORTER',
    amountCents: 50_000,
    description:
      'The highest individual support level.',
    benefits: [
      'Everything in Founding Supporter',
      'Executive Supporter designation',
      'Priority access to private campaign experiences',
      'Recognition in the campaign archive',
    ],
    badgeKey: 'executive',
    quantityLimit: 25,
    sortIndex: 5,
  },
] as const;

export type CampaignHealthRow = {
  songId: string;
  songSlug: string;
  songTitle: string;
  songStatus: string;
  campaignId: string | null;
  campaignName: string | null;
  campaignStatus: string | null;
  acceptSupport: boolean;
  fanSupportEnabled: boolean;
  tierCount: number;
  ready: boolean;
};

export async function listCampaignHealth(): Promise<
  CampaignHealthRow[]
> {
  const [songs, campaigns, tiers] =
    await Promise.all([
      db
        .select({
          id: s.songs.id,
          slug: s.songs.slug,
          title: s.songs.title,
          status: s.songs.status,
          sortIndex: s.songs.sortIndex,
        })
        .from(s.songs)
        .where(
          eq(
            s.songs.isPublished,
            true,
          ),
        )
        .orderBy(
          asc(s.songs.sortIndex),
          asc(s.songs.title),
        ),

      db
        .select({
          id: s.campaigns.id,
          songId: s.campaigns.songId,
          name: s.campaigns.name,
          status: s.campaigns.status,
          acceptSupport:
            s.campaigns.acceptSupport,
          fanSupportEnabled:
            s.campaigns.fanSupportEnabled,
          startsAt:
            s.campaigns.startsAt,
          endsAt:
            s.campaigns.endsAt,
          createdAt:
            s.campaigns.createdAt,
        })
        .from(s.campaigns)
        .orderBy(
          desc(
            s.campaigns.createdAt,
          ),
        ),

      db
        .select({
          campaignId:
            s.supportTiers.campaignId,
        })
        .from(s.supportTiers)
        .where(
          eq(
            s.supportTiers.isActive,
            true,
          ),
        ),
    ]);

  const now = Date.now();

  return songs.map((song) => {
    const songCampaigns =
      campaigns.filter(
        (campaign) =>
          campaign.songId ===
          song.id,
      );

    const campaign =
      songCampaigns.find(
        (candidate) =>
          candidate.status ===
          'live',
      ) ??
      songCampaigns[0] ??
      null;

    const tierCount = campaign
      ? tiers.filter(
          (tier) =>
            tier.campaignId ===
            campaign.id,
        ).length
      : 0;

    const withinDates =
      campaign
        ? (
            !campaign.startsAt ||
            campaign.startsAt.getTime() <=
              now
          ) &&
          (
            !campaign.endsAt ||
            campaign.endsAt.getTime() >
              now
          )
        : false;

    const ready =
      Boolean(campaign) &&
      campaign?.status === 'live' &&
      campaign.acceptSupport &&
      campaign.fanSupportEnabled &&
      withinDates &&
      tierCount > 0;

    return {
      songId: song.id,
      songSlug: song.slug,
      songTitle: song.title,
      songStatus: song.status,
      campaignId:
        campaign?.id ?? null,
      campaignName:
        campaign?.name ?? null,
      campaignStatus:
        campaign?.status ?? null,
      acceptSupport:
        campaign?.acceptSupport ??
        false,
      fanSupportEnabled:
        campaign
          ?.fanSupportEnabled ??
        false,
      tierCount,
      ready,
    };
  });
}

export async function activatePublishedCampaigns(): Promise<void> {
  const me = await requireAdmin();

  const songs = await dbw
    .select({
      id: s.songs.id,
      slug: s.songs.slug,
      title: s.songs.title,
    })
    .from(s.songs)
    .where(
      eq(
        s.songs.isPublished,
        true,
      ),
    )
    .orderBy(
      asc(s.songs.sortIndex),
      asc(s.songs.title),
    );

  for (const song of songs) {
    const existingCampaigns =
      await dbw
        .select()
        .from(s.campaigns)
        .where(
          eq(
            s.campaigns.songId,
            song.id,
          ),
        )
        .orderBy(
          desc(
            s.campaigns.createdAt,
          ),
        );

    const desiredSlug =
      `${song.slug}-support`;

    const desiredCampaign =
      existingCampaigns.find(
        (campaign) =>
          campaign.slug ===
          desiredSlug,
      );

    const liveCampaign =
      existingCampaigns.find(
        (campaign) =>
          campaign.status ===
          'live',
      );

    const chosenCampaign =
      liveCampaign ??
      desiredCampaign ??
      existingCampaigns[0] ??
      null;

    let campaignId: string;
    let campaignCreated = false;

    if (chosenCampaign) {
      campaignId =
        chosenCampaign.id;

      await dbw
        .update(s.campaigns)
        .set({
          status: 'live',
          acceptSupport: true,
          fanSupportEnabled: true,
          startsAt: null,
          endsAt: null,
          updatedAt: new Date(),
        })
        .where(
          eq(
            s.campaigns.id,
            campaignId,
          ),
        );
    } else {
      const [created] =
        await dbw
          .insert(s.campaigns)
          .values({
            songId: song.id,
            slug: desiredSlug,
            kind: 'release',
            name:
              `${song.title} — Support Campaign`,
            objective:
              `Fund the creative, production and promotional campaign for ${song.title}.`,
            goalCents:
              DEFAULT_GOAL_CENTS,
            status: 'live',
            startsAt: null,
            endsAt: null,
            acceptSupport: true,
            fanSupportEnabled: true,
            businessSponsorshipEnabled:
              true,
          })
          .returning({
            id: s.campaigns.id,
          });

      if (!created) {
        throw new Error(
          `Could not create a campaign for ${song.title}.`,
        );
      }

      campaignId = created.id;
      campaignCreated = true;
    }

    const existingTiers =
      await dbw
        .select({
          id: s.supportTiers.id,
        })
        .from(s.supportTiers)
        .where(
          eq(
            s.supportTiers.campaignId,
            campaignId,
          ),
        )
        .limit(1);

    let tiersCreated = false;

    if (
      existingTiers.length === 0
    ) {
      await dbw
        .insert(s.supportTiers)
        .values(
          DEFAULT_TIERS.map(
            (tier) => ({
              campaignId,
              name: tier.name,
              amountCents:
                tier.amountCents,
              description:
                tier.description,
              benefits:
                [...tier.benefits],
              badgeKey:
                tier.badgeKey,
              quantityLimit:
                'quantityLimit' in tier
                  ? tier.quantityLimit
                  : null,
              sortIndex:
                tier.sortIndex,
              isActive: true,
            }),
          ),
        );

      tiersCreated = true;
    }

    await recordAudit({
      adminUserId: me.id,
      action:
        'campaign.activate_published',
      entity: 'campaign',
      entityId: campaignId,
      after: {
        songId: song.id,
        songSlug: song.slug,
        campaignCreated,
        tiersCreated,
        status: 'live',
        acceptSupport: true,
        fanSupportEnabled: true,
      },
    });
  }

  revalidatePath('/back');
  revalidatePath('/music');
  revalidatePath('/admin/campaigns');

  for (const song of songs) {
    revalidatePath(
      `/song/${song.slug}`,
    );
  }

  redirect(
    '/admin/campaigns?updated=1',
  );
}
