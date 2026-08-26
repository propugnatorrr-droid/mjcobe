/**
 * Seeds a campaign that reads like a real one. Every headline figure comes
 * from docs/PRD.md: $18,420 of $25,000 (73%), 486 supporters, ABC Clothing
 * at $7,500, six sponsors.
 *
 * Product decision encoded here: the funding meter counts FAN contributions
 * only, with sponsorship displayed separately. The PRD's own sponsor figures
 * total $20,750, which would put this campaign at 157% before a single fan
 * arrived. Controlled by the `meterIncludesSponsorship` setting.
 *
 * Deterministic: same seed, same data, every run.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local', override: true });

import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as s from './schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: s });

// ---------- deterministic randomness ----------
function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260826);
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
const hash = (v: string) => createHash('sha256').update(v).digest('hex').slice(0, 32);

// ---------- targets ----------
const GOAL = 2_500_000;
const FAN_TARGET = 1_842_000;
const SUPPORTER_COUNT = 486;
const TIER_LADDER = [1_000, 2_500, 5_000, 10_000, 25_000, 50_000];

const TOP_FIVE = [
  { name: '@Marcus', amount: 125_000 },
  { name: '@jasmine.reyes', amount: 82_500 },
  { name: '@KDot_ATL', amount: 60_000 },
  { name: '@sincerely.tee', amount: 45_000 },
  { name: '@coreyw', amount: 40_050 },
];

const SPONSORS = [
  { name: 'ABC Clothing', slug: 'abc-clothing', amount: 750_000, industry: 'Apparel',
    site: 'https://abcclothing.example', ig: '@abcclothing',
    desc: 'Independent apparel label out of Atlanta. Small runs, heavy fabric, no logos on the front.' },
  { name: 'Lowkey Studios', slug: 'lowkey-studios', amount: 550_000, industry: 'Recording',
    site: 'https://lowkeystudios.example', ig: '@lowkeystudios',
    desc: 'Two rooms, one Neve, open late. Where most of this record got tracked.' },
  { name: 'Northbound Coffee Co.', slug: 'northbound-coffee', amount: 375_000, industry: 'Hospitality',
    site: 'https://northboundcoffee.example', ig: '@northboundcoffee',
    desc: 'Single-origin roaster with four counters across the city.' },
  { name: 'Vellum Eyewear', slug: 'vellum-eyewear', amount: 250_000, industry: 'Accessories',
    site: 'https://vellumeyewear.example', ig: '@vellumeyewear',
    desc: 'Hand-finished acetate frames, made in small batches.' },
  { name: 'Halcyon Barbers', slug: 'halcyon-barbers', amount: 100_000, industry: 'Grooming',
    site: 'https://halcyonbarbers.example', ig: '@halcyonbarbers',
    desc: 'Appointment-only shop on the east side. Third chair is always MJ\u2019s.' },
  { name: 'Ridgeline Print Co.', slug: 'ridgeline-print', amount: 50_000, industry: 'Printing',
    site: 'https://ridgelineprint.example', ig: '@ridgelineprint',
    desc: 'Screen printing and risograph. Handles all the campaign\u2019s physical runs.' },
];

const FIRST = ['marcus','jasmine','corey','tiana','devon','aaliyah','malik','simone','andre','nia',
  'quinton','imani','darius','kendra','xavier','leila','omar','shanice','elias','yara','trey','monique',
  'jaden','camille','rashad','noelle','desmond','priya','isaiah','fatima','lorenzo','ayana','micah','rosa'];
const LAST = ['reyes','holt','banks','okafor','ellis','navarro','whitfield','osei','march','delgado',
  'castille','burrell','adeyemi','strand','vance','moreau','ifill','beaumont','sowande','quill'];
const SUFFIX = ['','_','.','__','music','atl','ldn','x','ii','_official','sings','onthebeat'];

function handle(i: number): string {
  const style = Math.floor(rand() * 4);
  const f = pick(FIRST), l = pick(LAST);
  if (style === 0) return `@${f}.${l}`;
  if (style === 1) return `@${f}${pick(SUFFIX)}`;
  if (style === 2) return `@${f[0]}${l}${Math.floor(rand() * 90 + 10)}`;
  return `@${f}_${l[0]}`;
}

const CITIES = [
  ['Atlanta','US'],['Houston','US'],['London','GB'],['Toronto','CA'],['Chicago','US'],
  ['Lagos','NG'],['Los Angeles','US'],['Brooklyn','US'],['Paris','FR'],['Accra','GH'],
  ['Birmingham','GB'],['Detroit','US'],['Memphis','US'],['Amsterdam','NL'],['Dallas','US'],
] as const;

/** Long tail weighted so the mean lands near the PRD's implied average. */
function weightedAmount(): number {
  const r = rand();
  if (r < 0.60) return 1_000;
  if (r < 0.82) return 2_500;
  if (r < 0.92) return 5_000;
  if (r < 0.97) return 10_000;
  if (r < 0.99) return 25_000;
  return 50_000;
}

/**
 * Launch spike, mid-campaign lull, recent uptick — a flat distribution is
 * the fastest way to make seed data look fake.
 */
function contributionDate(start: Date, now: Date): Date {
  const span = now.getTime() - start.getTime();
  const r = rand();
  const t = r < 0.28 ? rand() * 0.12
    : r < 0.72 ? 0.12 + rand() * 0.6
    : 0.72 + rand() * 0.28;
  return new Date(start.getTime() + t * span);
}

async function main() {
  console.log('Clearing existing data…');
  // Order matters: children before parents.
  for (const t of [s.assetAccessLog, s.entitlementGrants, s.badgeGrants, s.rankSnapshots,
    s.notificationPrefs, s.notifications, s.impressions, s.contracts, s.exclusivityLocks,
    s.sponsorBids, s.referralVisits, s.referralLinks, s.analyticsEvents, s.moderationQueue,
    s.auditLog, s.blocklist, s.shareLinks, s.socialAssets, s.campaignMilestones,
    s.songUpdates, s.journeyEvents, s.invoices, s.consentRecords, s.disputes, s.refunds,
    s.ledgerEntries, s.transactions, s.contributions, s.supporterNumbers, s.supporters,
    s.users, s.badges, s.gatedAssets, s.sponsorPackages, s.supportTiers, s.sponsors,
    s.sponsorCategories, s.campaigns, s.songs, s.lookbookAssets, s.mediaAssets,
    s.settings, s.siteCopy, s.featureFlags, s.adminUsers, s.webhookEvents, s.idempotencyKeys]) {
    await db.delete(t);
  }

  // ---------- platform config ----------
  await db.insert(s.settings).values([
    { key: 'meterIncludesSponsorship', value: false, description: 'Whether business sponsorship counts toward the funding meter.' },
    { key: 'minBidCents', value: 1_000, description: 'Minimum contribution.' },
    { key: 'minIncrementCents', value: 50_000, description: 'Minimum raise to claim #1 as a sponsor.' },
    { key: 'fanIncrementCents', value: 100, description: 'Minimum raise to reclaim #1 as a fan.' },
    { key: 'leaderboardVisibleRows', value: 5 },
    { key: 'sponsorApprovalThresholdCents', value: 100_000, description: 'Sponsorships at or above this enter manual approval.' },
    { key: 'dailySpendCeilingCents', value: 200_000, description: 'Per-account 24h ceiling. Guardrail, not a sales limit.' },
    { key: 'weeklySoftWarningCents', value: 100_000, description: 'Shows a soft interstitial above this in 7 days.' },
    { key: 'antiSnipeWindowHours', value: 24 },
    { key: 'antiSnipeExtensionHours', value: 12 },
    { key: 'outbidNotificationCapPerDay', value: 3 },
    { key: 'quietHours', value: { start: 22, end: 9 } },
  ]);

  await db.insert(s.featureFlags).values([
    { key: 'outbid.fan', enabled: true, description: 'Fan #1 challenge and top-up.' },
    { key: 'outbid.business', enabled: true, description: 'Sponsor #1 claim.' },
    { key: 'shareGraphics', enabled: true },
    { key: 'happeningNow', enabled: true, description: 'Homepage live activity feed.' },
    { key: 'vault', enabled: false, description: 'Entitlement-gated content area.' },
    { key: 'referralLeaderboard', enabled: false },
    { key: 'simulationRibbon', enabled: true, description: 'Show SIMULATION MODE while payments are mocked.' },
  ]);

  await db.insert(s.adminUsers).values({
    email: 'admin@mjcobe.com', name: 'MJ COBE Management', role: 'super_admin',
  });

  // ---------- media ----------
  const [heroAsset, loopAsset] = await db.insert(s.mediaAssets).values([
    { kind: 'image', role: 'hero', path: 'media/hero/hero-1008.avif', width: 1008, height: 1792,
      altCopyKey: 'lookbook.hero_alt', dominantColor: '#111820' },
    { kind: 'video', role: 'loop', path: 'media/loop/loop.webm', width: 1280, height: 720,
      durationMs: 4060, altCopyKey: 'lookbook.loop_alt', dominantColor: '#0d1319' },
  ]).returning();

  await db.insert(s.lookbookAssets).values([
    { mediaAssetId: heroAsset.id, concept: 'beach-neo-noir', model: 'openart', approvedAt: new Date() },
    { mediaAssetId: loopAsset.id, concept: 'beach-neo-noir', model: 'byte-plus-seedance-2', approvedAt: new Date() },
  ]);

  // ---------- catalog ----------
  const now = new Date('2026-08-26T12:00:00Z');
  const campaignStart = new Date('2026-06-14T00:00:00Z');

  const [live, released1, released2, coming] = await db.insert(s.songs).values([
    { slug: 'cant-read-your-mind', title: "CAN'T READ YOUR MIND", status: 'building',
      coverAssetId: heroAsset.id, isPublished: true, sortIndex: 0,
      previewStartMs: 42_000, previewEndMs: 72_000,
      description: 'Written in one sitting after an argument that never got finished.' },
    { slug: 'some-real', title: 'SOME REAL', status: 'released', isPublished: true, sortIndex: 1,
      releaseDate: '2026-03-06', spotifyUrl: 'https://open.spotify.com/track/example1',
      appleMusicUrl: 'https://music.apple.com/track/example1',
      youtubeUrl: 'https://youtube.com/watch?v=example1',
      description: 'The first record. Recorded before anybody was listening.' },
    { slug: 'night-shift', title: 'NIGHT SHIFT', status: 'released', isPublished: true, sortIndex: 2,
      releaseDate: '2026-05-22', spotifyUrl: 'https://open.spotify.com/track/example2',
      appleMusicUrl: 'https://music.apple.com/track/example2',
      musicVideoUrl: 'https://youtube.com/watch?v=example2',
      description: 'Built around a rhythm guitar loop tracked at four in the morning.' },
    { slug: 'lower-frequency', title: 'LOWER FREQUENCY', status: 'coming_soon', isPublished: true,
      sortIndex: 3, description: 'Slower. Meaner. Coming after the visual.' },
  ]).returning();

  const [campaign] = await db.insert(s.campaigns).values({
    songId: live.id, slug: 'cant-read-your-mind', kind: 'release',
    name: "CAN'T READ YOUR MIND — Release Campaign",
    objective: 'Help us fund the visual campaign, content, marketing and rollout behind "Can\u2019t Read Your Mind."',
    goalCents: GOAL, status: 'live', startsAt: campaignStart,
    endsAt: new Date('2026-09-30T23:59:59Z'),
    allocationNote: 'Campaign support helps fund marketing, visual production, content, promotion and the continued development of MJ COBE.',
    previewSecret: 'prv_' + hash('cant-read-your-mind').slice(0, 12),
  }).returning();

  await db.insert(s.supportTiers).values([
    { campaignId: campaign.id, name: 'SUPPORTER', amountCents: 1_000, sortIndex: 0,
      badgeKey: 'supporter', benefits: ['Name on the supporter wall', 'Campaign updates'] },
    { campaignId: campaign.id, name: 'DAY ONE', amountCents: 2_500, sortIndex: 1,
      badgeKey: 'day_one', benefits: ['Everything above', 'Day One badge', 'Early preview access'] },
    { campaignId: campaign.id, name: 'INNER CIRCLE', amountCents: 5_000, sortIndex: 2,
      badgeKey: 'inner_circle', benefits: ['Everything above', 'Private content', 'Downloadable exclusive artwork'] },
    { campaignId: campaign.id, name: 'GOLD SUPPORTER', amountCents: 10_000, sortIndex: 3,
      badgeKey: 'gold', benefits: ['Priority placement on the supporter wall', 'Exclusive video content', 'Private livestream invitations'] },
    { campaignId: campaign.id, name: 'FOUNDING SUPPORTER', amountCents: 25_000, sortIndex: 4,
      badgeKey: 'founding', quantityLimit: 100,
      benefits: ['Permanent Founding Supporter designation', 'Premium profile placement', 'Credit on the campaign page', 'Exclusive drops'] },
    { campaignId: campaign.id, name: 'EXECUTIVE SUPPORTER', amountCents: 50_000, sortIndex: 5,
      badgeKey: 'executive', quantityLimit: 25,
      benefits: ['Signed limited merchandise', 'Private virtual listening session', 'Name in the visual credits', 'VIP event opportunities'] },
  ]);

  await db.insert(s.sponsorPackages).values([
    { campaignId: campaign.id, name: 'DIGITAL PARTNER', priceCents: 250_000, sortIndex: 0,
      deliverables: ['Song page placement'] },
    { campaignId: campaign.id, name: 'FEATURED PARTNER', priceCents: 500_000, sortIndex: 1,
      deliverables: ['Song page placement', 'Social acknowledgment'] },
    { campaignId: campaign.id, name: 'VISUAL PARTNER', priceCents: 1_000_000, sortIndex: 2,
      includesBrandedVisual: true,
      deliverables: ['MJ-created branded visual', 'Song page placement', 'Social campaign'] },
    { campaignId: campaign.id, name: 'PRESENTING PARTNER', priceCents: 2_500_000, sortIndex: 3,
      includesBrandedVisual: true,
      deliverables: ['Premier campaign placement', 'MJ-created branded visual', 'Collaborative post', 'Story placement', 'Campaign acknowledgment'] },
  ]);

  await db.insert(s.badges).values([
    { key: 'supporter', label: 'SUPPORTER', sortIndex: 0 },
    { key: 'day_one', label: 'DAY ONE', sortIndex: 1 },
    { key: 'inner_circle', label: 'INNER CIRCLE', sortIndex: 2 },
    { key: 'gold', label: 'GOLD SUPPORTER', sortIndex: 3 },
    { key: 'founding', label: 'FOUNDING SUPPORTER', sortIndex: 4 },
    { key: 'executive', label: 'EXECUTIVE SUPPORTER', sortIndex: 5 },
    { key: 'founding_100', label: 'FOUNDING 100', sortIndex: 6 },
    { key: 'top_ten', label: 'TOP 10 SUPPORTER', sortIndex: 7, isAutomatic: true },
    { key: 'number_one', label: '#1 SUPPORTER', sortIndex: 8, isAutomatic: true },
  ]);

  // ---------- fan amounts, reconciled to the exact target ----------
  const topSum = TOP_FIVE.reduce((a, b) => a + b.amount, 0);
  const tailCount = SUPPORTER_COUNT - TOP_FIVE.length;
  const tail: number[] = Array.from({ length: tailCount }, weightedAmount);

  const target = FAN_TARGET - topSum;
  let sum = tail.reduce((a, b) => a + b, 0);
  // Nudge through the tier ladder until we are within one tier step.
  for (let guard = 0; guard < 200_000 && Math.abs(sum - target) >= 1_000; guard++) {
    const i = Math.floor(rand() * tail.length);
    const idx = TIER_LADDER.indexOf(tail[i]);
    if (sum > target && idx > 0) { sum -= tail[i] - TIER_LADDER[idx - 1]; tail[i] = TIER_LADDER[idx - 1]; }
    else if (sum < target && idx >= 0 && idx < TIER_LADDER.length - 1) { sum += TIER_LADDER[idx + 1] - tail[i]; tail[i] = TIER_LADDER[idx + 1]; }
  }
  // Any residue becomes one custom amount — those exist in the wild.
  tail[tail.length - 1] += target - sum;

  const fanAmounts = [...TOP_FIVE.map((t) => t.amount), ...tail];
  const fanTotal = fanAmounts.reduce((a, b) => a + b, 0);
  if (fanTotal !== FAN_TARGET) throw new Error(`Fan total ${fanTotal} != ${FAN_TARGET}`);

  // ---------- supporters + contributions + transactions + ledger ----------
  const tiers = await db.select().from(s.supportTiers);
  const tierByAmount = new Map(tiers.map((t) => [t.amountCents, t.id]));
  const seen = new Set(TOP_FIVE.map((t) => t.name));

  type Row = {
    name: string; amount: number; anon: boolean; city: string; country: string; when: Date;
  };
  const rows: Row[] = fanAmounts.map((amount, i) => {
    let name: string;
    if (i < TOP_FIVE.length) name = TOP_FIVE[i].name;
    else { do { name = handle(i); } while (seen.has(name)); seen.add(name); }
    const [city, country] = pick(CITIES);
    return {
      name, amount,
      anon: i >= TOP_FIVE.length && rand() < 0.14,
      city, country,
      when: i < TOP_FIVE.length
        ? new Date(campaignStart.getTime() + rand() * 0.35 * (now.getTime() - campaignStart.getTime()))
        : contributionDate(campaignStart, now),
    };
  }).sort((a, b) => a.when.getTime() - b.when.getTime());

  console.log(`Inserting ${rows.length} supporters…`);
  const CHUNK = 150;
  let supporterNo = 0;
  let foundingNo = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);

    const supporterRows = await db.insert(s.supporters).values(batch.map((r) => ({
      emailHash: hash(r.name), email: `${r.name.replace('@', '')}@example.com`,
      displayName: r.name, isAnonymous: r.anon,
      instagram: rand() < 0.4 ? r.name : null,
      linksPublic: rand() < 0.5,
      city: r.city, country: r.country,
      moderation: 'approved' as const, createdAt: r.when,
    }))).returning({ id: s.supporters.id });

    const contribRows = await db.insert(s.contributions).values(batch.map((r, j) => ({
      campaignId: campaign.id, songId: live.id, supporterId: supporterRows[j].id,
      supportType: 'fan' as const, tierId: tierByAmount.get(r.amount) ?? null,
      amountCents: r.amount,
      displayNameSnapshot: r.anon ? null : r.name,
      isAnonymous: r.anon, leaderboardVisible: true,
      moderation: 'approved' as const, isTest: false, createdAt: r.when,
    }))).returning({ id: s.contributions.id });

    const txRows = await db.insert(s.transactions).values(batch.map((r, j) => ({
      contributionId: contribRows[j].id, provider: 'mock' as const,
      providerRef: `mock_${hash(r.name + r.amount).slice(0, 18)}`,
      state: 'settled' as const, amountCents: r.amount, currency: 'USD', isTest: false,
      authorizedAt: r.when, capturedAt: r.when, settledAt: r.when, createdAt: r.when,
    }))).returning({ id: s.transactions.id });

    await db.insert(s.ledgerEntries).values(batch.map((r, j) => ({
      campaignId: campaign.id, contributionId: contribRows[j].id,
      transactionId: txRows[j].id, supporterId: supporterRows[j].id,
      kind: 'contribution' as const, amountCents: r.amount, occurredAt: r.when,
    })));

    await db.insert(s.consentRecords).values(batch.map((r, j) => ({
      contributionId: contribRows[j].id, supportType: 'fan' as const,
      textVersion: 'v1', textHash: hash('fan-consent-v1'), agreedAt: r.when,
    })));

    await db.insert(s.supporterNumbers).values(batch.flatMap((r, j) => {
      const out = [{
        campaignId: campaign.id, contributionId: contribRows[j].id,
        seriesKey: 'supporter', number: ++supporterNo, issuedAt: r.when,
      }];
      if (r.amount >= 25_000 && foundingNo < 100) {
        out.push({
          campaignId: campaign.id, contributionId: contribRows[j].id,
          seriesKey: 'founding', number: ++foundingNo, issuedAt: r.when,
        });
      }
      return out;
    }));
  }

  // ---------- sponsors ----------
  console.log('Inserting sponsors…');
  const categories = await db.insert(s.sponsorCategories).values([
    { slug: 'apparel', name: 'Apparel' }, { slug: 'recording', name: 'Recording' },
    { slug: 'hospitality', name: 'Hospitality' }, { slug: 'accessories', name: 'Accessories' },
    { slug: 'grooming', name: 'Grooming' }, { slug: 'printing', name: 'Printing' },
    { slug: 'gambling', name: 'Gambling', isProhibited: true },
    { slug: 'vaping', name: 'Vaping & Tobacco', isProhibited: true },
    { slug: 'lending', name: 'Short-term Lending', isProhibited: true },
  ]).returning();
  const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  for (const [i, sp] of SPONSORS.entries()) {
    const when = new Date(campaignStart.getTime() + (0.05 + i * 0.13) * (now.getTime() - campaignStart.getTime()));
    const [sponsor] = await db.insert(s.sponsors).values({
      slug: sp.slug, businessName: sp.name, repName: 'Partnerships',
      email: `partnerships@${sp.slug.replace(/-/g, '')}.example`,
      website: sp.site, instagram: sp.ig, industry: sp.industry,
      categoryId: catBySlug.get(sp.industry.toLowerCase()) ?? null,
      description: sp.desc, moderation: 'approved', approvedAt: when,
      supportedSince: when, createdAt: when,
    }).returning();

    const [contribution] = await db.insert(s.contributions).values({
      campaignId: campaign.id, songId: live.id, sponsorId: sponsor.id,
      supportType: 'business', amountCents: sp.amount,
      displayNameSnapshot: sp.name, leaderboardVisible: true,
      moderation: 'approved', createdAt: when,
    }).returning();

    const [tx] = await db.insert(s.transactions).values({
      contributionId: contribution.id,
      provider: i === 0 ? 'offline' : 'mock',
      offlineMethod: i === 0 ? 'wire' : null,
      providerRef: i === 0 ? 'WIRE-2026-0041' : `mock_${hash(sp.slug).slice(0, 18)}`,
      state: 'settled', amountCents: sp.amount, currency: 'USD',
      authorizedAt: when, capturedAt: when, settledAt: when, createdAt: when,
    }).returning();

    await db.insert(s.ledgerEntries).values({
      campaignId: campaign.id, contributionId: contribution.id, transactionId: tx.id,
      sponsorId: sponsor.id, kind: 'contribution', amountCents: sp.amount, occurredAt: when,
      note: i === 0 ? 'Wire transfer, entered manually' : null,
    });

    await db.insert(s.sponsorBids).values({
      campaignId: campaign.id, sponsorId: sponsor.id, contributionId: contribution.id,
      amountCents: sp.amount, state: 'approved', placedAt: when, resolvedAt: when,
    });

    await db.insert(s.invoices).values({
      sponsorId: sponsor.id, contributionId: contribution.id, number: 1000 + i,
      amountCents: sp.amount, status: 'issued', issuedAt: when,
    });
  }

  // ---------- journey, updates, milestones ----------
  console.log('Inserting journey…');
  const d = (iso: string) => new Date(iso);
  await db.insert(s.journeyEvents).values([
    { songId: live.id, campaignId: campaign.id, kind: 'campaign_opened', occurredAt: d('2026-06-14T09:00:00Z'),
      title: 'Campaign opened', body: 'Thirty seconds of the record went up. Nothing else.' },
    { songId: live.id, campaignId: campaign.id, kind: 'supporter_milestone', occurredAt: d('2026-06-18T14:20:00Z'),
      title: 'First 100 supporters', body: 'Four days.' },
    { songId: live.id, campaignId: campaign.id, kind: 'new_top_sponsor', occurredAt: d('2026-06-27T11:05:00Z'),
      title: 'Lowkey Studios comes in', body: 'The room the record was tracked in became a partner in it.' },
    { songId: live.id, campaignId: campaign.id, kind: 'funding_milestone', occurredAt: d('2026-07-05T19:40:00Z'),
      title: '$10,000 backed', body: null },
    { songId: live.id, campaignId: campaign.id, kind: 'production_update', occurredAt: d('2026-07-19T08:00:00Z'),
      title: 'Visual treatment locked', body: 'Three locations, one night, no crew over eight people.' },
    { songId: live.id, campaignId: campaign.id, kind: 'new_top_sponsor', occurredAt: d('2026-08-02T16:30:00Z'),
      title: 'ABC Clothing takes the #1 partner position', body: 'Wired, not swiped. First presenting partner of the campaign.' },
    { songId: live.id, campaignId: campaign.id, kind: 'production_update', occurredAt: d('2026-08-21T10:15:00Z'),
      title: 'Official music video production has begun', body: 'Shooting across three nights this week.' },
    { songId: released2.id, kind: 'release', occurredAt: d('2026-05-22T05:00:00Z'),
      title: 'NIGHT SHIFT released', body: 'Out everywhere.' },
    { songId: released2.id, kind: 'stream_milestone', occurredAt: d('2026-06-30T00:00:00Z'),
      title: '100,000 streams', body: null },
    { songId: released1.id, kind: 'release', occurredAt: d('2026-03-06T05:00:00Z'),
      title: 'SOME REAL released', body: 'The first one.' },
  ]);

  await db.insert(s.songUpdates).values([
    { songId: live.id, campaignId: campaign.id, title: 'Video production has begun',
      body: 'We start shooting Thursday. Three nights, three locations, and the beach from the preview is one of them.',
      publishedAt: d('2026-08-21T10:15:00Z') },
    { songId: live.id, campaignId: campaign.id, title: 'Rough cut — Inner Circle only',
      body: 'Ninety seconds of the assembly edit. Please keep it here.',
      minTierCents: 5_000, publishedAt: d('2026-08-24T21:00:00Z') },
  ]);

  await db.insert(s.campaignMilestones).values([
    { campaignId: campaign.id, kind: 'supporters_100', reachedAt: d('2026-06-18T14:20:00Z'), isPublished: true },
    { campaignId: campaign.id, kind: 'raised_5k', reachedAt: d('2026-06-24T12:00:00Z'), isPublished: true },
    { campaignId: campaign.id, kind: 'raised_10k', reachedAt: d('2026-07-05T19:40:00Z'), isPublished: true },
    { campaignId: campaign.id, kind: 'funded_50', reachedAt: d('2026-07-11T09:30:00Z'), isPublished: true },
    { campaignId: campaign.id, kind: 'new_presenting_partner', reachedAt: d('2026-08-02T16:30:00Z'), isPublished: true },
  ]);

  await db.insert(s.referralLinks).values([
    { code: 'ABC', campaignId: campaign.id, label: 'ABC Clothing sponsor link' },
    { code: 'IG-BIO', campaignId: campaign.id, label: 'Instagram bio' },
  ]);

  await db.insert(s.blocklist).values([
    { kind: 'industry', value: 'gambling', note: 'Prohibited category' },
    { kind: 'industry', value: 'vaping', note: 'Prohibited category' },
    { kind: 'industry', value: 'short-term lending', note: 'Prohibited category' },
  ]);

  // ---------- copy ----------
  await db.insert(s.siteCopy).values([
    { key: 'hero.artist_name', value: 'MJ COBE' },
    { key: 'hero.tagline', value: 'SOUL HAS A NEW FACE.' },
    { key: 'hero.subcopy', value: 'Original R&B. A new visual world. A career being built in real time.' },
    { key: 'song.proof_line', value: '{count} PEOPLE WERE HERE BEFORE THE WORLD CAUGHT ON.' },
    { key: 'checkout.disclaimer', value: 'Contributions are voluntary support for MJ COBE\u2019s creative and promotional campaigns and do not provide ownership, equity, royalties, securities, repayment rights or financial returns.' },
    { key: 'checkout.terms_fan', value: 'I understand this contribution is support/sponsorship and does not represent an investment, ownership interest, royalty interest or promise of financial return.' },
    { key: 'checkout.terms_business', value: 'I understand sponsorship benefits are limited to the promotional benefits described for this campaign and are subject to approval by MJ COBE Management.' },
    { key: 'sponsor.ownership_notice', value: 'Sponsorship does not provide ownership of MJ COBE or the underlying music. Sponsorship purchases promotional placement and participation in the campaign.' },
    { key: 'confirmation.heading', value: 'YOU\u2019RE PART OF THE JOURNEY.' },
    { key: 'partners.heading', value: 'BUILD WITH MJ COBE' },
    { key: 'partners.subcopy', value: 'Put your brand behind music, visuals and culture while the story is being created.' },
  ]);

  // ---------- verify ----------
  const [{ fan, sponsor, count }] = await sql`
    select
      coalesce(sum(case when c.support_type = 'fan' then l.amount_cents end), 0)::int as fan,
      coalesce(sum(case when c.support_type = 'business' then l.amount_cents end), 0)::int as sponsor,
      count(distinct case when c.support_type = 'fan' then c.supporter_id end)::int as count
    from ledger_entries l
    join contributions c on c.id = l.contribution_id
    join transactions t on t.id = l.transaction_id
    where l.campaign_id = ${campaign.id} and t.state = 'settled'
  ` as unknown as [{ fan: number; sponsor: number; count: number }];

  console.log('\n--- SEED VERIFICATION ---');
  console.log(`Fan raised     $${(fan / 100).toLocaleString()}  (target $18,420)`);
  console.log(`Supporters     ${count}  (target 486)`);
  console.log(`Funded         ${Math.floor((fan / GOAL) * 100)}%  (target 73%)`);
  console.log(`Sponsor raised $${(sponsor / 100).toLocaleString()}  (target $20,750)`);
  console.log(`Founding nos.  ${foundingNo} issued of 100`);
  console.log('-------------------------\n');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
