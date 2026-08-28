'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createHash } from 'node:crypto';
import { and, eq, or } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { setting } from '@/lib/config/settings';
import { text } from '@/lib/copy/site-copy';
import { formatCents, cents } from '@/lib/money/cents';
import { createContribution, settleContribution } from '@/lib/ledger/contributions';
import { consentFor } from '@/lib/consent/text';
import { createThanksToken } from './tokens';
import { getTopSpot } from '@/lib/campaign/queries';
import {
  storePendingSponsorLogo,
  storeSponsorLogo,
  validateSponsorLogo,
} from '@/lib/media/sponsor-logo';
import { bool, EMAIL_RE, normalizeHandle, parseAmountCents, slugify, str } from './validate';
import {
  getSelectableTier,
} from '@/lib/tiers/queries';

export type CheckoutState = { error?: string };

const sha = (v: string) => createHash('sha256').update(v).digest('hex');

async function requestFingerprint() {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  return { ipHash: ip ? sha(ip) : undefined, userAgent: h.get('user-agent') ?? undefined };
}

/** Campaign state is re-read server-side; a stale form must not be payable. */
async function loadPayableCampaign(campaignId: string, scope: 'fan' | 'business') {
  const [row] = await db.select().from(s.campaigns).where(eq(s.campaigns.id, campaignId)).limit(1);
  if (!row) return null;
  if (
    row.status !== 'live' ||
    !row.acceptSupport
  ) {
    return null;
  }

  const now = Date.now();

  if (
    row.startsAt &&
    row.startsAt.getTime() > now
  ) {
    return null;
  }

  if (
    row.endsAt &&
    row.endsAt.getTime() <= now
  ) {
    return null;
  }
  if (scope === 'fan' && !row.fanSupportEnabled) return null;
  if (scope === 'business' && !row.businessSponsorshipEnabled) return null;
  return row;
}

async function isBlocked(values: (string | null)[]) {
  const candidates = values.filter(Boolean).map((v) => v!.toLowerCase());
  if (candidates.length === 0) return false;
  const rows = await db.select().from(s.blocklist);
  return rows.some((entry) => {
    const needle = entry.value.toLowerCase();
    return candidates.some((c) => c === needle || c.endsWith(`@${needle}`) || c.includes(needle));
  });
}

async function songSlugFor(songId: string) {
  const [song] = await db.select({ slug: s.songs.slug }).from(s.songs).where(eq(s.songs.id, songId)).limit(1);
  return song?.slug ?? '';
}

// ---------------------------------------------------------------- fan --------

export async function submitFanContribution(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  // Honeypot: a real person never fills a hidden field.
  if (str(formData.get('company_website_confirm'))) {
    return { error: await text('checkout.error.blocked') };
  }

  const campaignId = str(formData.get('campaignId'));
  if (!campaignId) return { error: await text('checkout.error.closed') };

  const campaign = await loadPayableCampaign(campaignId, 'fan');
  if (!campaign) return { error: await text('checkout.error.closed') };

  const min = await setting('minContributionCents');
  const max = await setting('maxContributionCents');
  const nameMax = await setting('displayNameMaxLength');

  const presetId = str(formData.get('tierId'));
  let amountCents: number | null = null;
  let tierId: string | null = null;

  if (presetId) {
    const tier =
      await getSelectableTier(
        campaign.id,
        presetId,
      );

    if (!tier) {
      return {
        error: await text(
          'checkout.error.closed',
        ),
      };
    }

    amountCents = tier.amountCents;
    tierId = tier.id;
  }

  if (amountCents === null) amountCents = parseAmountCents(formData.get('amount'));

  if (amountCents === null || amountCents < min || amountCents > max) {
    return {
      error: await text('checkout.error.amount', {
        min: formatCents(cents(min)),
        max: formatCents(cents(max)),
      }),
    };
  }

  const email = str(formData.get('email'), 254);
  if (!email || !EMAIL_RE.test(email)) return { error: await text('checkout.error.email') };

  const displayNameRaw = str(formData.get('displayName'), nameMax + 1);
  if (displayNameRaw && displayNameRaw.length > nameMax) {
    return { error: await text('checkout.error.display_name', { max: nameMax }) };
  }

  if (!bool(formData.get('consent'))) return { error: await text('checkout.error.consent') };

  const instagram = normalizeHandle(str(formData.get('instagram'), 64));
  if (await isBlocked([email, displayNameRaw, instagram])) {
    return { error: await text('checkout.error.blocked') };
  }

  const consent = await consentFor('fan');
  const { ipHash, userAgent } = await requestFingerprint();
  const isAnonymous = bool(formData.get('anonymous'));

  let token: string;
  try {
    const created = await createContribution({
      campaignId: campaign.id,
      songId: campaign.songId,
      supportType: 'fan',
      amountCents,
      tierId,
      supporter: {
        email,
        displayName: displayNameRaw,
        isAnonymous,
        instagram,
        city: str(formData.get('city'), 64),
      },
      consent: { version: consent.version, text: consent.text, ipHash, userAgent },
      simulateCard: str(formData.get('simulateCard'), 32) ?? undefined,
    });

    if (bool(formData.get('hideAmount'))) {
      await dbw
        .update(s.contributions)
        .set({ hideAmount: true })
        .where(eq(s.contributions.id, created.contributionId));
    }

    const slug = await songSlugFor(campaign.songId);
    token = await createThanksToken({
      contributionId: created.contributionId,
      targetPath: `/song/${slug}`,
    });

    const settled = await settleContribution(created.transactionId);
    if (!settled.ok) {
      return {
        error:
          settled.code === 'pending'
            ? await text('checkout.error.generic')
            : await text('checkout.error.declined'),
      };
    }

    revalidatePath(`/song/${slug}`);
  } catch {
    return { error: await text('checkout.error.generic') };
  }

  redirect(`/thanks/${token}`);
}

// ------------------------------------------------------------ business -------

export async function submitSponsorship(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  if (str(formData.get('company_website_confirm'))) {
    return { error: await text('checkout.error.blocked') };
  }

  const campaignId = str(formData.get('campaignId'));
  if (!campaignId) return { error: await text('checkout.error.closed') };

  const campaign = await loadPayableCampaign(campaignId, 'business');
  if (!campaign) return { error: await text('checkout.error.closed') };

  const min = await setting('sponsorMinContributionCents');
  const max = await setting('maxContributionCents');

  const packageId = str(formData.get('packageId'));
  let amountCents: number | null = null;
  if (packageId) {
    const [pkg] = await db
      .select()
      .from(s.sponsorPackages)
      .where(
        and(
          eq(s.sponsorPackages.id, packageId),
          eq(
            s.sponsorPackages.campaignId,
            campaign.id,
          ),
          eq(s.sponsorPackages.isActive, true),
        ),
      )
      .limit(1);
    if (pkg) amountCents = pkg.priceCents;
  }
  if (amountCents === null) amountCents = parseAmountCents(formData.get('amount'));

  if (
    amountCents === null ||
    amountCents < min ||
    amountCents > max
  ) {
    return {
      error: await text('checkout.error.amount', {
        min: formatCents(cents(min)),
        max: formatCents(cents(max)),
      }),
    };
  }

  if (bool(formData.get('claimTop'))) {
    const topSpot = await getTopSpot(
      campaign.id,
      'business',
    );

    if (amountCents < topSpot.minimumToLeadCents) {
      return {
        error: await text(
          'checkout.error.minimum_to_lead',
          {
            amount: formatCents(
              cents(topSpot.minimumToLeadCents),
            ),
          },
        ),
      };
    }
  }

  const businessName = str(
    formData.get('businessName'),
    120,
  );

  if (!businessName) return { error: await text('checkout.error.business_name') };

  const email = str(formData.get('email'), 254);
  if (!email || !EMAIL_RE.test(email)) return { error: await text('checkout.error.email') };

  if (!bool(formData.get('consent'))) return { error: await text('checkout.error.consent') };

  const website = str(formData.get('website'), 200);
  const domain = website?.replace(/^https?:\/\//i, '').split('/')[0] ?? null;
  if (await isBlocked([email, businessName, domain])) {
    return { error: await text('checkout.error.blocked') };
  }

const logoValidation =
  await validateSponsorLogo(
    formData.get('logo'),
  );


  if (!logoValidation.ok) {
    return {
      error:
        logoValidation.reason === 'size'
          ? await text('checkout.logo.error_size')
          : await text('checkout.logo.error_type'),
    };
  }

  const consent = await consentFor('business');
  const { ipHash, userAgent } =
    await requestFingerprint();

  let token: string;

  try {
// Reuse an existing sponsor record when the
// same business returns, so subsequent support
// remains attached to one public identity.
const [existing] = await db
  .select()
  .from(s.sponsors)
  .where(
    or(
      eq(s.sponsors.email, email),
      eq(
        s.sponsors.businessName,
        businessName,
      ),
    ),
  )
  .limit(1);

let sponsorId = existing?.id ?? null;
let logoAssetId: string | null = null;

if (logoValidation.file) {
  try {
    if (
      existing &&
      (
        existing.moderation ===
          'approved' ||
        existing.moderation ===
          'hidden'
      )
    ) {
      await storePendingSponsorLogo(
        logoValidation.file,
        existing.id,
      );
    } else {
      logoAssetId =
        await storeSponsorLogo(
          logoValidation.file,
        );
    }
  } catch {
    return {
      error: await text(
        'checkout.logo.error_upload',
      ),
    };
  }
}

    if (!sponsorId) {
      const [created] = await dbw
        .insert(s.sponsors)
        .values({
          slug: `${slugify(businessName)}-${Math.random().toString(36).slice(2, 6)}`,
          businessName,
          repName: str(formData.get('repName'), 120),
          email,
          phone: str(formData.get('phone'), 40),
          website,
          instagram: normalizeHandle(
            str(formData.get('instagram'), 64),
          ),
          industry: str(
            formData.get('industry'),
            80,
          ),
          message: str(
            formData.get('message'),
            1000,
          ),
          logoAssetId,
          moderation: 'pending',
        })
        .returning({ id: s.sponsors.id });
      sponsorId = created.id;
} else if (
  logoAssetId &&
  existing?.moderation !== 'approved' &&
  existing?.moderation !== 'hidden'
) {
  await dbw
    .update(s.sponsors)
    .set({
      logoAssetId,
    })
    .where(
      eq(
        s.sponsors.id,
        sponsorId,
      ),
    );
}

    const created = await createContribution({
      campaignId: campaign.id,
      songId: campaign.songId,
      supportType: 'business',
      amountCents,
      sponsorId,
      consent: { version: consent.version, text: consent.text, ipHash, userAgent },
      simulateCard: str(formData.get('simulateCard'), 32) ?? undefined,
    });

    const slug = await songSlugFor(campaign.songId);
    token = await createThanksToken({
      contributionId: created.contributionId,
      targetPath: `/song/${slug}`,
    });

    const threshold =
      campaign.sponsorApprovalThresholdCents ??
      (await setting('sponsorApprovalThresholdCents'));
    const needsReview = !campaign.sponsorAutoApprove && amountCents >= threshold;

    // Held sponsorships get no ledger entry, so they cannot reach the
    // leaderboard before a human has looked at them (PRD §28).
    if (!needsReview) {
      const settled = await settleContribution(created.transactionId);
      if (!settled.ok) return { error: await text('checkout.error.declined') };
      revalidatePath(`/song/${slug}`);
    }
  } catch {
    return { error: await text('checkout.error.generic') };
  }

  redirect(`/thanks/${token}`);
}
