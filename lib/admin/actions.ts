'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { requireAdmin } from './guard';
import { endSession, passwordMatches, startSession } from './session';
import { recordAudit } from '@/lib/audit/log';
import {
  cancelContribution,
  refundContribution,
  settleContribution,
} from '@/lib/ledger/contributions';
import { consentFor } from '@/lib/consent/text';
import { createContribution } from '@/lib/ledger/contributions';
import { bool, parseAmountCents, slugify, str } from '@/lib/checkout/validate';
import {
  retryNotification as retryNotificationDelivery,
} from '@/lib/notifications/outbox';
import {
  deleteUnreferencedLogoAsset,
  getPendingSponsorLogos,
  storePendingSponsorLogo,
  validateSponsorLogo,
} from '@/lib/media/sponsor-logo';
import type { RefundReasonCode } from '@/lib/payments';
import {
  sponsorApprovalAction,
  sponsorDeclineAction,
} from '@/lib/sponsor/review';
import {
  recordCampaignLifecycle,
} from '@/lib/journey/lifecycle';


export type AdminState = {
  error?: string;
  ok?: string;
};

const REFUND_REASONS = new Set<RefundReasonCode>([
  'unverified_sponsor',
  'fraud_risk',
  'brand_safety',
  'duplicate_payment',
  'customer_request',
  'other',
]);

function refundReason(
  value: FormDataEntryValue | null,
): RefundReasonCode {
  const candidate = str(value);

  if (
    candidate &&
    REFUND_REASONS.has(
      candidate as RefundReasonCode,
    )
  ) {
    return candidate as RefundReasonCode;
  }

  return 'other';
}

async function ipHash() {

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim();
  return ip ? createHash('sha256').update(ip).digest('hex') : null;
}

// -------------------------------------------------------------- referrals ----

export async function createReferralLink(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdmin();
  const code = str(formData.get('code'), 40)?.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const campaignId = str(formData.get('campaignId'));
  if (!code || !campaignId) return { error: 'missing' };

  const [created] = await dbw
    .insert(s.referralLinks)
    .values({ code, campaignId, label: str(formData.get('label'), 200) })
    .onConflictDoNothing()
    .returning({ id: s.referralLinks.id });

  if (!created) return { error: 'duplicate' };

  await recordAudit({
    adminUserId: me.id,
    action: 'referral_link.create',
    entity: 'referral_link',
    entityId: created.id,
    after: { code, campaignId },
    ipHash: await ipHash(),
  });

  revalidatePath('/admin/referrals');
  return { ok: 'saved' };
}

// -------------------------------------------------------------- blocklist ----

export async function addBlocklistEntry(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdmin();
  const kind = str(formData.get('kind')) as
    | 'domain' | 'email' | 'name' | 'category' | 'industry' | null;
  const value = str(formData.get('value'), 200)?.toLowerCase();
  if (!kind || !value) return { error: 'missing' };

  await dbw
    .insert(s.blocklist)
    .values({ kind, value, note: str(formData.get('note'), 300) })
    .onConflictDoNothing();

  await recordAudit({
    adminUserId: me.id,
    action: 'blocklist.add',
    entity: 'blocklist',
    entityId: value,
    after: { kind, value },
    ipHash: await ipHash(),
  });

  revalidatePath('/admin/blocklist');
  return { ok: 'saved' };
}

export async function removeBlocklistEntry(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = str(formData.get('id'));
  if (!id) return;

  const [before] = await db.select().from(s.blocklist).where(eq(s.blocklist.id, id)).limit(1);
  if (!before) return;

  await dbw.delete(s.blocklist).where(eq(s.blocklist.id, id));

  await recordAudit({
    adminUserId: me.id,
    action: 'blocklist.remove',
    entity: 'blocklist',
    entityId: id,
    before: { kind: before.kind, value: before.value },
    ipHash: await ipHash(),
  });

  revalidatePath('/admin/blocklist');
}

// ------------------------------------------------------------------ auth ----

export async function signIn(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const email = str(formData.get('email'), 254)?.toLowerCase();
  const password = str(formData.get('password'), 200);
  if (!email || !password) return { error: 'auth' };

  const [row] = await db
    .select()
    .from(s.adminUsers)
    .where(and(eq(s.adminUsers.email, email), eq(s.adminUsers.isActive, true)))
    .limit(1);

  if (!row || !passwordMatches(password)) return { error: 'auth' };

  await dbw
    .update(s.adminUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(s.adminUsers.id, row.id));

  await startSession(row.email);
  redirect('/admin');
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect('/admin/login');
}

// ---------------------------------------------------------- moderation ------

export async function moderateContribution(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = str(formData.get('contributionId'));
  const action = str(formData.get('action'));
  if (!id || !action) return;

  const [before] = await db
    .select()
    .from(s.contributions)
    .where(eq(s.contributions.id, id))
    .limit(1);
  if (!before) return;

  const patch: Partial<typeof s.contributions.$inferInsert> = {};

  if (action === 'approve') patch.moderation = 'approved';
  if (action === 'flag') patch.moderation = 'flagged';
  if (action === 'hide') {
    patch.moderation = 'hidden';
    patch.leaderboardVisible = false;
  }
  if (action === 'unhide') {
    patch.moderation = 'approved';
    patch.leaderboardVisible = true;
  }
  if (action === 'rename') {
    patch.displayNameSnapshot = str(formData.get('displayName'), 64);
  }

  if (Object.keys(patch).length === 0) return;

  await dbw.update(s.contributions).set(patch).where(eq(s.contributions.id, id));

  await recordAudit({
    adminUserId: me.id,
    action: `contribution.${action}`,
    entity: 'contribution',
    entityId: id,
    before: { moderation: before.moderation, leaderboardVisible: before.leaderboardVisible, displayName: before.displayNameSnapshot },
    after: patch,
    ipHash: await ipHash(),
  });

  revalidatePath('/admin/contributions');
  revalidatePath('/', 'layout');
}

/** Blocks the identity behind a contribution, then hides it. */
export async function blockFromContribution(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = str(formData.get('contributionId'));
  const value = str(formData.get('blockValue'), 200);
  const kind = (str(formData.get('blockKind')) ?? 'email') as
    'domain' | 'email' | 'name' | 'category' | 'industry';
  if (!id || !value) return;

  await dbw.insert(s.blocklist).values({ kind, value, note: `contribution ${id}` })
    .onConflictDoNothing();

  await dbw
    .update(s.contributions)
    .set({ moderation: 'blocked', leaderboardVisible: false })
    .where(eq(s.contributions.id, id));

  await recordAudit({
    adminUserId: me.id,
    action: 'contribution.block',
    entity: 'contribution',
    entityId: id,
    after: { kind, value },
    ipHash: await ipHash(),
  });

  revalidatePath('/admin/contributions');
  revalidatePath('/', 'layout');
}

// -------------------------------------------------------------- refunds -----

export async function issueRefund(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdmin();
  const transactionId = str(formData.get('transactionId'));
  const reason = refundReason(
    formData.get('reason'),
  );
  if (!transactionId) return { error: 'missing' };

  const [tx] = await db
    .select()
    .from(s.transactions)
    .where(eq(s.transactions.id, transactionId))
    .limit(1);
  if (!tx) return { error: 'missing' };

  /*
   * Blank amount means the actual remaining
   * ledger balance, not the original payment
   * amount. This matters after a partial
   * refund.
   */
  const typed =
    parseAmountCents(
      formData.get('amount'),
    );

  const [balance] =
    await db
      .select({
        total: sql<number>`
          coalesce(
            sum(
              ${s.ledgerEntries.amountCents}
            ),
            0
          )::int
        `,
      })
      .from(s.ledgerEntries)
      .where(
        eq(
          s.ledgerEntries.transactionId,
          transactionId,
        ),
      );

  const amountCents =
    typed ??
    Number(
      balance?.total ?? 0,
    );

  if (
    !Number.isInteger(
      amountCents,
    ) ||
    amountCents <= 0
  ) {
    return {
      error:
        'No refundable balance remains.',
    };
  }


  const result = await refundContribution({
    transactionId,
    amountCents,
    reason,
    note: str(formData.get('note'), 500) ?? undefined,
    adminUserId: me.id,
  });

  if (!result.ok) return { error: result.message ?? 'failed' };

  revalidatePath('/admin/contributions');
  revalidatePath('/', 'layout');
  return { ok: 'saved' };
}

// ------------------------------------------------------------- sponsors -----

async function loadSponsorReview(
  contributionId: string,
) {
  const [contribution] = await db
    .select()
    .from(s.contributions)
    .where(eq(s.contributions.id, contributionId))
    .limit(1);

  if (
    !contribution ||
    contribution.supportType !== 'business' ||
    !contribution.sponsorId
  ) {
    return null;
  }

  const [transactionRows, sponsorRows, songRows] =
    await Promise.all([
      db
        .select()
        .from(s.transactions)
        .where(
          eq(
            s.transactions.contributionId,
            contribution.id,
          ),
        )
        .limit(1),

      db
        .select()
        .from(s.sponsors)
        .where(
          eq(
            s.sponsors.id,
            contribution.sponsorId,
          ),
        )
        .limit(1),

      db
        .select({
          slug: s.songs.slug,
        })
        .from(s.songs)
        .where(
          eq(
            s.songs.id,
            contribution.songId,
          ),
        )
        .limit(1),
    ]);

  const transaction = transactionRows[0];
  const sponsor = sponsorRows[0];
  const song = songRows[0];

  if (!transaction || !sponsor || !song) {
    return null;
  }

  return {
    contribution,
    transaction,
    sponsor,
    song,
  };
}

function revalidateSponsorSurfaces(args: {
  songSlug: string;
  sponsorSlug: string;
}) {
  revalidatePath('/admin');
  revalidatePath('/admin/sponsors');
  revalidatePath('/admin/contributions');
  revalidatePath('/partners');
  revalidatePath(
    `/song/${args.songSlug}`,
  );
  revalidatePath(
    `/song/${args.songSlug}/sponsors`,
  );
  revalidatePath(
    `/partner/${args.sponsorSlug}`,
  );
  revalidatePath('/', 'layout');
}

 /* Override path only. Sponsorship approves itself on settlement; this exists
 * for the exceptions — a name flagged by screening, or a payment that stalled
 * in authorized because a provider webhook never arrived.
 */
export async function approveSponsor(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();
  const contributionId = str(
    formData.get('contributionId'),
  );

  if (!contributionId) {
    return;
  }

  const review = await loadSponsorReview(
    contributionId,
  );

  if (!review) {
    return;
  }

  const approvalAction =
    sponsorApprovalAction({
      transactionState:
        review.transaction.state,
      contributionModeration:
        review.contribution
          .moderation,
    });

  if (
    approvalAction ===
    'complete'
  ) {
    revalidateSponsorSurfaces({
      songSlug:
        review.song.slug,
      sponsorSlug:
        review.sponsor.slug,
    });

    return;
  }

  /*
   * Stripe manual-capture payments may only
   * be approved after authorization. Hidden
   * and blocked contributions must never be
   * captured through this action.
   */
  if (
    approvalAction !==
    'capture'
  ) {
    await recordAudit({
      adminUserId: me.id,
      action:
        'sponsor.approve_not_ready',
      entity:
        'contribution',
      entityId:
        contributionId,
      after: {
        transactionId:
          review.transaction.id,
        transactionState:
          review.transaction.state,
        contributionModeration:
          review.contribution
            .moderation,
      },
      ipHash:
        await ipHash(),
    });

    return;
  }


  const before = {
    contributionModeration:
      review.contribution.moderation,
    sponsorModeration:
      review.sponsor.moderation,
    transactionState:
      review.transaction.state,
  };

  const settled = await settleContribution(
    review.transaction.id,
  );

  if (!settled.ok) {
    await recordAudit({
      adminUserId: me.id,
      action: 'sponsor.approve_failed',
      entity: 'contribution',
      entityId: contributionId,
      before,
      after: {
        code: settled.code,
        message: settled.message,
      },
      ipHash: await ipHash(),
    });

    return;
  }

  const now = new Date();

  await dbw.transaction(async (tx) => {
    await tx
      .update(s.sponsors)
      .set({
        moderation: 'approved',
        approvedAt: now,
        supportedSince:
          review.sponsor.supportedSince ?? now,
      })
      .where(
        eq(
          s.sponsors.id,
          review.sponsor.id,
        ),
      );

    await tx
      .update(s.contributions)
      .set({
        moderation: 'approved',
        leaderboardVisible: true,
      })
      .where(
        eq(
          s.contributions.id,
          contributionId,
        ),
      );
  });

  await recordAudit({
    adminUserId: me.id,
    action: 'sponsor.approve',
    entity: 'contribution',
    entityId: contributionId,
    before,
    after: {
      contributionModeration: 'approved',
      sponsorModeration: 'approved',
      transactionState: 'settled',
      sponsorId: review.sponsor.id,
      transactionId: review.transaction.id,
    },
    ipHash: await ipHash(),
  });

  revalidateSponsorSurfaces({
    songSlug: review.song.slug,
    sponsorSlug: review.sponsor.slug,
  });
}

export async function declineSponsor(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();
  const contributionId = str(
    formData.get('contributionId'),
  );
  const reason = refundReason(
    formData.get('reason'),
  );

  if (!contributionId) {
    return;
  }

  const review = await loadSponsorReview(
    contributionId,
  );

  if (!review) {
    return;
  }

  const before = {
    contributionModeration:
      review.contribution.moderation,
    sponsorModeration:
      review.sponsor.moderation,
    transactionState:
      review.transaction.state,
  };

    const declineAction =
    sponsorDeclineAction(
      review.transaction.state,
    );

  if (
    declineAction ===
    'wait'
  ) {
    await recordAudit({
      adminUserId: me.id,
      action:
        'sponsor.decline_not_ready',
      entity:
        'contribution',
      entityId:
        contributionId,
      before,
      after: {
        transactionId:
          review.transaction.id,
        transactionState:
          review.transaction.state,
      },
      reason,
      ipHash:
        await ipHash(),
    });

    return;
  }

  if (
    declineAction ===
    'refund'
  ) {
    const [balance] =
      await db
        .select({
          total: sql<number>`
            coalesce(
              sum(
                ${s.ledgerEntries.amountCents}
              ),
              0
            )::int
          `,
        })
        .from(
          s.ledgerEntries,
        )
        .where(
          eq(
            s.ledgerEntries
              .transactionId,
            review.transaction.id,
          ),
        );

    const remainingCents =
      Number(
        balance?.total ?? 0,
      );

    if (
      remainingCents > 0
    ) {
      const refunded =
        await refundContribution({
          transactionId:
            review.transaction.id,
          amountCents:
            remainingCents,
          reason,
          adminUserId:
            me.id,
        });

      if (
        !refunded.ok
      ) {
        await recordAudit({
          adminUserId:
            me.id,
          action:
            'sponsor.decline_failed',
          entity:
            'contribution',
          entityId:
            contributionId,
          before,
          after: {
            message:
              refunded.message ??
              'Refund failed.',
          },
          reason,
          ipHash:
            await ipHash(),
        });

        return;
      }
    }
  }

  if (
    declineAction ===
    'cancel'
  ) {
    const canceled =
      await cancelContribution(
        review.transaction.id,
      );

    if (
      !canceled.ok
    ) {
      await recordAudit({
        adminUserId:
          me.id,
        action:
          'sponsor.decline_failed',
        entity:
          'contribution',
        entityId:
          contributionId,
        before,
        after: {
          code:
            canceled.code,
          message:
            canceled.message,
        },
        reason,
        ipHash:
          await ipHash(),
      });

      return;
    }
  }


  await dbw
    .update(s.contributions)
    .set({
      moderation: 'blocked',
      leaderboardVisible: false,
    })
    .where(
      eq(
        s.contributions.id,
        contributionId,
      ),
    );

  const [sponsorBalance] = await db
    .select({
      total: sql<number>`
        coalesce(
          sum(${s.ledgerEntries.amountCents}),
          0
        )::int
      `,
    })
    .from(s.ledgerEntries)
    .where(
      eq(
        s.ledgerEntries.sponsorId,
        review.sponsor.id,
      ),
    );

  const sponsorBalanceCents = Number(
    sponsorBalance?.total ?? 0,
  );

  if (sponsorBalanceCents <= 0) {
    await dbw
      .update(s.sponsors)
      .set({
        moderation: 'blocked',
        approvedAt: null,
      })
      .where(
        eq(
          s.sponsors.id,
          review.sponsor.id,
        ),
      );
  }

  await recordAudit({
    adminUserId: me.id,
    action: 'sponsor.decline',
    entity: 'contribution',
    entityId: contributionId,
    before,
    after: {
      contributionModeration: 'blocked',
      leaderboardVisible: false,
      sponsorModeration:
        sponsorBalanceCents <= 0
          ? 'blocked'
          : review.sponsor.moderation,
      remainingSponsorBalanceCents:
        sponsorBalanceCents,
      sponsorId: review.sponsor.id,
      transactionId: review.transaction.id,
    },
    reason,
    ipHash: await ipHash(),
  });

  revalidateSponsorSurfaces({
    songSlug: review.song.slug,
    sponsorSlug: review.sponsor.slug,
  });
}

function optionalPublicUrl(
  value: FormDataEntryValue | null,
): string | null {
  const input = str(value, 500);

  if (!input) {
    return null;
  }

  const candidate =
    input.startsWith('http://') ||
    input.startsWith('https://')
      ? input
      : `https://${input}`;

  try {
    const url = new URL(candidate);

    if (
      url.protocol !== 'http:' &&
      url.protocol !== 'https:'
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function instagramHandle(
  value: FormDataEntryValue | null,
): string | null {
  const input = str(value, 100);

  if (!input) {
    return null;
  }

  const withoutUrl = input
    .replace(
      /^https?:\/\/(www\.)?instagram\.com\//i,
      '',
    )
    .split(/[/?#]/)[0];

  const normalized = withoutUrl
    .replace(/^@/, '')
    .replace(/[^a-zA-Z0-9._]/g, '')
    .slice(0, 30);

  return normalized || null;
}

export async function updateSponsorProfile(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();
  const sponsorId = str(
    formData.get('sponsorId'),
  );
  const businessName = str(
    formData.get('businessName'),
    120,
  );

  if (!sponsorId || !businessName) {
    return;
  }

  const [before] = await db
    .select()
    .from(s.sponsors)
    .where(
      eq(s.sponsors.id, sponsorId),
    )
    .limit(1);

  if (!before) {
    return;
  }

  const patch = {
    businessName,
    repName: str(
      formData.get('repName'),
      120,
    ),
    email: str(
      formData.get('email'),
      254,
    )?.toLowerCase() ?? null,
    phone: str(
      formData.get('phone'),
      40,
    ),
    website: optionalPublicUrl(
      formData.get('website'),
    ),
    instagram: instagramHandle(
      formData.get('instagram'),
    ),
    shopUrl: optionalPublicUrl(
      formData.get('shopUrl'),
    ),
    industry: str(
      formData.get('industry'),
      120,
    ),
    description: str(
      formData.get('description'),
      2000,
    ),
  };

  await dbw
    .update(s.sponsors)
    .set(patch)
    .where(
      eq(s.sponsors.id, sponsorId),
    );

  await recordAudit({
    adminUserId: me.id,
    action: 'sponsor.profile_update',
    entity: 'sponsor',
    entityId: sponsorId,
    before: {
      businessName: before.businessName,
      repName: before.repName,
      email: before.email,
      phone: before.phone,
      website: before.website,
      instagram: before.instagram,
      shopUrl: before.shopUrl,
      industry: before.industry,
      description: before.description,
    },
    after: patch,
    ipHash: await ipHash(),
  });

  revalidatePath('/admin/sponsors');
  revalidatePath('/admin/sponsors/manage');
  revalidatePath(
    `/admin/sponsors/${sponsorId}`,
  );
  revalidatePath(
    `/partner/${before.slug}`,
  );
  revalidatePath('/partners');
  revalidatePath('/', 'layout');
}

export async function moderateSponsorVisibility(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();
  const sponsorId = str(
    formData.get('sponsorId'),
  );
  const action = str(
    formData.get('action'),
  );

  if (
    !sponsorId ||
    (action !== 'hide' &&
      action !== 'show')
  ) {
    return;
  }

  const [before] = await db
    .select()
    .from(s.sponsors)
    .where(
      eq(s.sponsors.id, sponsorId),
    )
    .limit(1);

  if (!before) {
    return;
  }

  if (
    action === 'hide' &&
    before.moderation !== 'approved'
  ) {
    return;
  }

  if (
    action === 'show' &&
    before.moderation !== 'hidden'
  ) {
    return;
  }

  const nextModeration =
    action === 'hide'
      ? 'hidden'
      : 'approved';

  await dbw.transaction(async (tx) => {
    await tx
      .update(s.sponsors)
      .set({
        moderation: nextModeration,
        approvedAt:
          action === 'show'
            ? before.approvedAt ??
              new Date()
            : before.approvedAt,
      })
      .where(
        eq(s.sponsors.id, sponsorId),
      );

    if (action === 'hide') {
      await tx
        .update(s.contributions)
        .set({
          leaderboardVisible: false,
        })
        .where(
          and(
            eq(
              s.contributions.sponsorId,
              sponsorId,
            ),
            eq(
              s.contributions.supportType,
              'business',
            ),
          ),
        );
    } else {
      await tx
        .update(s.contributions)
        .set({
          leaderboardVisible: true,
        })
        .where(
          and(
            eq(
              s.contributions.sponsorId,
              sponsorId,
            ),
            eq(
              s.contributions.supportType,
              'business',
            ),
            eq(
              s.contributions.moderation,
              'approved',
            ),
          ),
        );
    }
  });

  await recordAudit({
    adminUserId: me.id,
    action: `sponsor.${action}`,
    entity: 'sponsor',
    entityId: sponsorId,
    before: {
      moderation: before.moderation,
    },
    after: {
      moderation: nextModeration,
    },
    ipHash: await ipHash(),
  });

  revalidatePath('/admin/sponsors');
  revalidatePath('/admin/sponsors/manage');
  revalidatePath(
    `/admin/sponsors/${sponsorId}`,
  );
  revalidatePath(
    `/partner/${before.slug}`,
  );
  revalidatePath('/partners');
  revalidatePath('/', 'layout');
}
function revalidateSponsorProfile(
  sponsorId: string,
  sponsorSlug: string,
) {
  revalidatePath('/admin/sponsors');
  revalidatePath(
    '/admin/sponsors/manage',
  );
  revalidatePath(
    `/admin/sponsors/${sponsorId}`,
  );
  revalidatePath(
    `/partner/${sponsorSlug}`,
  );
  revalidatePath('/partners');
  revalidatePath('/', 'layout');
}

export async function uploadSponsorLogo(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();
  const sponsorId = str(
    formData.get('sponsorId'),
  );

  if (!sponsorId) {
    return;
  }

  const [sponsor] = await db
    .select()
    .from(s.sponsors)
    .where(
      eq(s.sponsors.id, sponsorId),
    )
    .limit(1);

  if (!sponsor) {
    return;
  }

  const validation =
    await validateSponsorLogo(
      formData.get('logo'),
    );

  if (
    !validation.ok ||
    !validation.file
  ) {
    await recordAudit({
      adminUserId: me.id,
      action:
        'sponsor.logo_upload_rejected',
      entity: 'sponsor',
      entityId: sponsorId,
      before: {
        logoAssetId:
          sponsor.logoAssetId,
      },
      after: {
        reason: validation.ok
          ? 'missing'
          : validation.reason,
      },
      ipHash: await ipHash(),
    });

    return;
  }

  const assetId =
    await storePendingSponsorLogo(
      validation.file,
      sponsorId,
    );

  await recordAudit({
    adminUserId: me.id,
    action:
      'sponsor.logo_upload_pending',
    entity: 'sponsor',
    entityId: sponsorId,
    before: {
      logoAssetId:
        sponsor.logoAssetId,
    },
    after: {
      pendingLogoAssetId: assetId,
    },
    ipHash: await ipHash(),
  });

  revalidateSponsorProfile(
    sponsorId,
    sponsor.slug,
  );
}

export async function approveSponsorLogo(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();
  const sponsorId = str(
    formData.get('sponsorId'),
  );
  const assetId = str(
    formData.get('assetId'),
  );

  if (!sponsorId || !assetId) {
    return;
  }

  const [sponsor] = await db
    .select()
    .from(s.sponsors)
    .where(
      eq(s.sponsors.id, sponsorId),
    )
    .limit(1);

  if (!sponsor) {
    return;
  }

  const pending =
    await getPendingSponsorLogos(
      sponsorId,
    );

  const selected = pending.find(
    (asset) => asset.id === assetId,
  );

  if (!selected) {
    return;
  }

  const previousAssetId =
    sponsor.logoAssetId;

  await dbw.transaction(async (tx) => {
    await tx
      .update(s.sponsors)
      .set({
        logoAssetId: selected.id,
      })
      .where(
        eq(
          s.sponsors.id,
          sponsorId,
        ),
      );

    await tx
      .update(s.mediaAssets)
      .set({
        role: 'logo',
        derivatives: {},
      })
      .where(
        eq(
          s.mediaAssets.id,
          selected.id,
        ),
      );
  });

  await recordAudit({
    adminUserId: me.id,
    action: 'sponsor.logo_approve',
    entity: 'sponsor',
    entityId: sponsorId,
    before: {
      logoAssetId:
        previousAssetId,
    },
    after: {
      logoAssetId: selected.id,
    },
    ipHash: await ipHash(),
  });

  for (const asset of pending) {
    if (asset.id !== selected.id) {
      await deleteUnreferencedLogoAsset(
        asset.id,
      );
    }
  }

  if (
    previousAssetId &&
    previousAssetId !== selected.id
  ) {
    await deleteUnreferencedLogoAsset(
      previousAssetId,
    );
  }

  revalidateSponsorProfile(
    sponsorId,
    sponsor.slug,
  );
}

export async function rejectSponsorLogo(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();
  const sponsorId = str(
    formData.get('sponsorId'),
  );
  const assetId = str(
    formData.get('assetId'),
  );

  if (!sponsorId || !assetId) {
    return;
  }

  const [sponsor] = await db
    .select()
    .from(s.sponsors)
    .where(
      eq(s.sponsors.id, sponsorId),
    )
    .limit(1);

  if (!sponsor) {
    return;
  }

  const pending =
    await getPendingSponsorLogos(
      sponsorId,
    );

  const selected = pending.find(
    (asset) => asset.id === assetId,
  );

  if (!selected) {
    return;
  }

  await deleteUnreferencedLogoAsset(
    selected.id,
  );

  await recordAudit({
    adminUserId: me.id,
    action: 'sponsor.logo_reject',
    entity: 'sponsor',
    entityId: sponsorId,
    before: {
      pendingLogoAssetId:
        selected.id,
      pendingLogoPath:
        selected.path,
    },
    after: {
      pendingLogoAssetId: null,
    },
    ipHash: await ipHash(),
  });

  revalidateSponsorProfile(
    sponsorId,
    sponsor.slug,
  );
}

// -------------------------------------------------------------- offline -----

export async function addOfflineContribution(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const me = await requireAdmin();

  const campaignId = str(formData.get('campaignId'));
  const amountCents = parseAmountCents(formData.get('amount'));
  const supportType = (str(formData.get('supportType')) ?? 'fan') as 'fan' | 'business';
  if (!campaignId || !amountCents) return { error: 'missing' };

  const [campaign] = await db
    .select()
    .from(s.campaigns)
    .where(eq(s.campaigns.id, campaignId))
    .limit(1);
  if (!campaign) return { error: 'missing' };

  const email = str(formData.get('email'), 254);
  const consent = await consentFor(supportType);

  let sponsorId: string | null = null;
  if (supportType === 'business') {
    const businessName = str(formData.get('businessName'), 120);
    if (!businessName) return { error: 'missing' };
    const [created] = await dbw
      .insert(s.sponsors)
      .values({
        slug: `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${Math.random().toString(36).slice(2, 6)}`,
        businessName,
        email,
        moderation: 'approved',
        approvedAt: new Date(),
        supportedSince: new Date(),
      })
      .returning({ id: s.sponsors.id });
    sponsorId = created.id;
  }

  const created = await createContribution({
    campaignId,
    songId: campaign.songId,
    supportType,
    amountCents,
    sponsorId,
    supporter:
      supportType === 'fan' && email
        ? { email, displayName: str(formData.get('displayName'), 64) }
        : undefined,
    consent: { version: consent.version, text: consent.text },
    providerId: 'offline',
  });

  const settled = await settleContribution(created.transactionId);
  if (!settled.ok) return { error: settled.message };

  const method = (str(formData.get('method')) ?? 'other') as 'cash' | 'check' | 'wire' | 'other';
  await dbw
    .update(s.transactions)
    .set({ offlineMethod: method })
    .where(eq(s.transactions.id, created.transactionId));

  const visible = bool(formData.get('leaderboardEligible'));
  await dbw
    .update(s.contributions)
    .set({ moderation: 'approved', leaderboardVisible: visible })
    .where(eq(s.contributions.id, created.contributionId));

  await recordAudit({
    adminUserId: me.id,
    action: 'contribution.offline',
    entity: 'contribution',
    entityId: created.contributionId,
    after: { amountCents, supportType, method, visible },
    ipHash: await ipHash(),
  });

  revalidatePath('/admin');
  revalidatePath('/', 'layout');
  return { ok: 'saved' };
}

// --------------------------------------------------------------- settings ---

export async function saveSetting(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdmin();
  const key = str(formData.get('key'), 100);
  const raw = str(formData.get('value'), 5000);
  if (!key) return { error: 'missing' };

  if (raw === null) {
    await dbw.delete(s.settings).where(eq(s.settings.key, key));
    await recordAudit({ adminUserId: me.id, action: 'setting.delete', entity: 'setting', entityId: key });
    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout');
    return { ok: 'saved' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: 'json' };
  }

  const [before] = await db.select().from(s.settings).where(eq(s.settings.key, key)).limit(1);

  await dbw
    .insert(s.settings)
    .values({ key, value: parsed as never, updatedByAdminId: me.id })
    .onConflictDoUpdate({
      target: s.settings.key,
      set: { value: parsed as never, updatedAt: new Date(), updatedByAdminId: me.id },
    });

  await recordAudit({
    adminUserId: me.id,
    action: 'setting.save',
    entity: 'setting',
    entityId: key,
    before: before?.value ?? null,
    after: parsed,
  });

  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  return { ok: 'saved' };
}

// ----------------------------------------------------------------- songs ----

export async function createSong(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdmin();
  const title = str(formData.get('title'), 200);
  if (!title) return { error: 'missing' };

  const slug = str(formData.get('slug'), 80) || slugify(title);
  const status = (str(formData.get('status')) ?? 'draft') as typeof s.songs.$inferInsert.status;

  const [created] = await dbw
    .insert(s.songs)
    .values({
      slug,
      title,
      status,
      description: str(formData.get('description'), 2000),
      spotifyUrl: str(formData.get('spotifyUrl'), 500),
      appleMusicUrl: str(formData.get('appleMusicUrl'), 500),
      youtubeUrl: str(formData.get('youtubeUrl'), 500),
      musicVideoUrl: str(formData.get('musicVideoUrl'), 500),
      isPublished: bool(formData.get('isPublished')),
    })
    .returning({ id: s.songs.id });

  await recordAudit({
    adminUserId: me.id,
    action: 'song.create',
    entity: 'song',
    entityId: created.id,
    after: { title, slug, status },
    ipHash: await ipHash(),
  });

  revalidatePath('/admin/songs');
  revalidatePath('/music');
  revalidatePath('/', 'layout');
  redirect(`/admin/songs/${created.id}`);
}

export async function updateSong(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdmin();
  const id = str(formData.get('id'));
  const title = str(formData.get('title'), 200);
  if (!id || !title) return { error: 'missing' };

  const [before] = await db.select().from(s.songs).where(eq(s.songs.id, id)).limit(1);
  if (!before) return { error: 'missing' };

  const slug = str(formData.get('slug'), 80) || before.slug;
  const status = (str(formData.get('status')) ?? before.status) as typeof s.songs.$inferInsert.status;

  const patch = {
    title,
    slug,
    status,
    description: str(formData.get('description'), 2000),
    spotifyUrl: str(formData.get('spotifyUrl'), 500),
    appleMusicUrl: str(formData.get('appleMusicUrl'), 500),
    youtubeUrl: str(formData.get('youtubeUrl'), 500),
    musicVideoUrl: str(formData.get('musicVideoUrl'), 500),
    isPublished: bool(formData.get('isPublished')),
    updatedAt: new Date(),
  };

  await dbw.update(s.songs).set(patch).where(eq(s.songs.id, id));

  await recordAudit({
    adminUserId: me.id,
    action: 'song.update',
    entity: 'song',
    entityId: id,
    before: { title: before.title, slug: before.slug, status: before.status },
    after: { title, slug, status },
    ipHash: await ipHash(),
  });

  revalidatePath(`/admin/songs/${id}`);
  revalidatePath('/admin/songs');
  revalidatePath('/music');
  revalidatePath(`/song/${slug}`);
  revalidatePath('/', 'layout');
  return { ok: 'saved' };
}

// ------------------------------------------------------------- campaigns ----

export async function createCampaign(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdmin();
  const songId = str(formData.get('songId'));
  const name = str(formData.get('name'), 200);
  const goalCents = parseAmountCents(formData.get('goal'));
  if (!songId || !name || !goalCents) return { error: 'missing' };

  const [song] = await db.select().from(s.songs).where(eq(s.songs.id, songId)).limit(1);
  if (!song) return { error: 'missing' };

  const slug = `${song.slug}-${slugify(name)}`.slice(0, 80);

  const [created] = await dbw
    .insert(s.campaigns)
    .values({
      songId,
      slug,
      name,
      goalCents,
      kind: (str(formData.get('kind')) ?? 'release') as typeof s.campaigns.$inferInsert.kind,
      status: (str(formData.get('status')) ?? 'draft') as typeof s.campaigns.$inferInsert.status,
      objective: str(formData.get('objective'), 500),
      fanSupportEnabled: bool(formData.get('fanSupportEnabled')),
      businessSponsorshipEnabled: bool(formData.get('businessSponsorshipEnabled')),
    })
    .returning({ id: s.campaigns.id });

  await recordAudit({
    adminUserId: me.id,
    action: 'campaign.create',
    entity: 'campaign',
    entityId: created.id,
    after: { songId, name, goalCents },
    ipHash: await ipHash(),
  });

  revalidatePath(`/admin/songs/${songId}`);
  revalidatePath('/music');
  revalidatePath(`/song/${song.slug}`);
  revalidatePath('/', 'layout');
  return { ok: 'saved' };
}

export async function updateCampaign(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdmin();
  const id = str(formData.get('id'));
  const songId = str(formData.get('songId'));
  if (!id || !songId) return { error: 'missing' };

  const [before] = await db.select().from(s.campaigns).where(eq(s.campaigns.id, id)).limit(1);
  if (!before) return { error: 'missing' };

  const name = str(formData.get('name'), 200) ?? before.name;
  const goalCents = parseAmountCents(formData.get('goal')) ?? before.goalCents;
  const status = (str(formData.get('status')) ?? before.status) as typeof s.campaigns.$inferInsert.status;

  const patch = {
    name,
    goalCents,
    status,
    objective: str(formData.get('objective'), 500),
    fanSupportEnabled: bool(formData.get('fanSupportEnabled')),
    businessSponsorshipEnabled: bool(formData.get('businessSponsorshipEnabled')),
    /*
     * A campaign that is not live must not be
     * payable. Keeping these in sync here means
     * closing a campaign genuinely closes
     * checkout rather than only changing a label.
     */
    acceptSupport: status === 'live',
    updatedAt: new Date(),
  };

  await dbw.update(s.campaigns).set(patch).where(eq(s.campaigns.id, id));

  if (before.status !== status) {
    await recordCampaignLifecycle({
      songId,
      campaignId: id,
      previousStatus: before.status,
      nextStatus: status,
      campaignName: name,
    });
  }


  const [song] = await db.select({ slug: s.songs.slug }).from(s.songs).where(eq(s.songs.id, songId)).limit(1);

  await recordAudit({
    adminUserId: me.id,
    action: 'campaign.update',
    entity: 'campaign',
    entityId: id,
    before: { name: before.name, goalCents: before.goalCents, status: before.status },
    after: { name, goalCents, status },
    ipHash: await ipHash(),
  });

  revalidatePath(`/admin/songs/${songId}`);
  revalidatePath('/music');
  if (song) revalidatePath(`/song/${song.slug}`);
  revalidatePath('/', 'layout');
  return { ok: 'saved' };
}

// ------------------------------------------------------------------ copy ----

export async function saveCopy(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const key = str(formData.get('key'), 120);
  const value = str(formData.get('value'), 5000);
  if (!key) return;

  const [before] = await db.select().from(s.siteCopy).where(eq(s.siteCopy.key, key)).limit(1);

  if (value === null) {
    await dbw.delete(s.siteCopy).where(eq(s.siteCopy.key, key));
  } else {
    await dbw
      .insert(s.siteCopy)
      .values({ key, value, updatedByAdminId: me.id })
      .onConflictDoUpdate({
        target: s.siteCopy.key,
        set: { value, updatedAt: new Date(), updatedByAdminId: me.id },
      });
  }

  await recordAudit({
    adminUserId: me.id,
    action: value === null ? 'copy.reset' : 'copy.save',
    entity: 'site_copy',
    entityId: key,
    before: before?.value ?? null,
    after: value,
  });

  revalidatePath('/admin/copy');
  revalidatePath('/', 'layout');
}
// --------------------------------------------------------- notifications ----

export async function retryNotification(
  formData: FormData,
): Promise<void> {
  const me =
    await requireAdmin();

  const notificationId =
    str(
      formData.get(
        'notificationId',
      ),
    );

  if (!notificationId) {
    return;
  }

  const result =
    await retryNotificationDelivery(
      notificationId,
    );

  await recordAudit({
    adminUserId: me.id,
    action:
      result.ok
        ? 'notification.retry'
        : 'notification.retry_failed',
    entity:
      'notification',
    entityId:
      notificationId,
    after: {
      ok: result.ok,
      error:
        result.error ?? null,
    },
    ipHash:
      await ipHash(),
  });

  revalidatePath(
    '/admin/notifications',
  );
}
