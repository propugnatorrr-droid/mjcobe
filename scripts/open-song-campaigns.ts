import { config as loadEnv } from 'dotenv';

loadEnv({
  path: '.env.local',
  override: true,
});

import {
  and,
  asc,
  eq,
} from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';

const DEFAULT_GOAL_CENTS = 2_500_000;

const DEFAULT_TIERS = [
  {
    name: 'SUPPORTER',
    amountCents: 1_000,
    sortIndex: 0,
    badgeKey: 'supporter',
    benefits: [
      'Name on the supporter wall',
      'Campaign updates',
    ],
  },
  {
    name: 'DAY ONE',
    amountCents: 2_500,
    sortIndex: 1,
    badgeKey: 'day_one',
    benefits: [
      'Everything above',
      'Day One badge',
      'Early preview access',
    ],
  },
  {
    name: 'INNER CIRCLE',
    amountCents: 5_000,
    sortIndex: 2,
    badgeKey: 'inner_circle',
    benefits: [
      'Everything above',
      'Private campaign content',
      'Downloadable exclusive artwork',
    ],
  },
  {
    name: 'GOLD SUPPORTER',
    amountCents: 10_000,
    sortIndex: 3,
    badgeKey: 'gold',
    benefits: [
      'Priority supporter-wall placement',
      'Exclusive video content',
      'Private livestream invitations',
    ],
  },
  {
    name: 'FOUNDING SUPPORTER',
    amountCents: 25_000,
    sortIndex: 4,
    badgeKey: 'founding',
    quantityLimit: 100,
    benefits: [
      'Permanent Founding Supporter designation',
      'Premium profile placement',
      'Campaign-page credit',
      'Exclusive drops',
    ],
  },
  {
    name: 'EXECUTIVE SUPPORTER',
    amountCents: 50_000,
    sortIndex: 5,
    badgeKey: 'executive',
    quantityLimit: 25,
    benefits: [
      'Signed limited merchandise',
      'Private virtual listening session',
      'Name in the visual credits',
      'VIP event opportunities',
    ],
  },
] as const;

function requestedSlugs() {
  return process.argv
    .slice(2)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

async function findPublishedSong(slug: string) {
  const [song] = await db
    .select({
      id: s.songs.id,
      slug: s.songs.slug,
      title: s.songs.title,
      isPublished: s.songs.isPublished,
    })
    .from(s.songs)
    .where(eq(s.songs.slug, slug))
    .limit(1);

  if (!song) {
    throw new Error(`Song not found: ${slug}`);
  }

  if (!song.isPublished) {
    throw new Error(
      `Song must be published before support can open: ${slug}`,
    );
  }

  return song;
}

async function findLiveCampaign(songId: string) {
  const campaigns = await db
    .select()
    .from(s.campaigns)
    .where(
      and(
        eq(s.campaigns.songId, songId),
        eq(s.campaigns.status, 'live'),
        eq(s.campaigns.acceptSupport, true),
      ),
    )
    .orderBy(asc(s.campaigns.createdAt))
    .limit(1);

  return campaigns[0] ?? null;
}

async function createCampaign(
  song: Awaited<ReturnType<typeof findPublishedSong>>,
) {
  const [campaign] = await db
    .insert(s.campaigns)
    .values({
      songId: song.id,
      slug: `${song.slug}-support`,
      kind: 'release',
      name: `${song.title} — Support Campaign`,
      objective:
        `Support the creative campaign, visual production, marketing and rollout behind ${song.title}.`,
      allocationNote:
        'Campaign support helps fund visual production, content, promotion, marketing and the continued development of MJ COBE.',
      goalCents: DEFAULT_GOAL_CENTS,
      status: 'live',
      startsAt: new Date(),
      endsAt: null,
      acceptSupport: true,
      fanSupportEnabled: true,
      businessSponsorshipEnabled: true,
    })
    .returning();

  if (!campaign) {
    throw new Error(
      `Campaign creation returned no row for ${song.slug}`,
    );
  }

  return campaign;
}

async function ensureTiers(campaignId: string) {
  const existing = await db
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

  if (existing.length > 0) {
    return false;
  }

  await db
    .insert(s.supportTiers)
    .values(
      DEFAULT_TIERS.map((tier) => ({
        campaignId,
        name: tier.name,
        amountCents: tier.amountCents,
        sortIndex: tier.sortIndex,
        badgeKey: tier.badgeKey,
        quantityLimit:
          'quantityLimit' in tier
            ? tier.quantityLimit
            : null,
        benefits: [...tier.benefits],
        isActive: true,
      })),
    );

  return true;
}

async function openSong(slug: string) {
  const song = await findPublishedSong(slug);

  let campaign =
    await findLiveCampaign(song.id);

  let campaignCreated = false;

  if (!campaign) {
    campaign = await createCampaign(song);
    campaignCreated = true;
  }

  const tiersCreated =
    await ensureTiers(campaign.id);

  console.log(
    [
      `Song: ${song.title}`,
      `Campaign: ${campaign.slug}`,
      `Campaign created: ${campaignCreated ? 'yes' : 'no'}`,
      `Tiers created: ${tiersCreated ? 'yes' : 'no'}`,
      `Checkout: /back?song=${song.slug}`,
    ].join('\n'),
  );

  console.log('---');
}

async function main() {
  const slugs = requestedSlugs();

  if (slugs.length === 0) {
    throw new Error(
      [
        'Provide at least one published song slug.',
        '',
        'Example:',
        'npm run campaign:open -- some-real night-shift lower-frequency',
      ].join('\n'),
    );
  }

  for (const slug of slugs) {
    await openSong(slug);
  }
}

main()
  .then(() => {
    console.log('Campaign activation complete.');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
