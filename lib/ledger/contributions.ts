import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { getProvider } from '@/lib/payments';
import type { ProviderId, RefundReasonCode } from '@/lib/payments';

export const sha = (v: string) => createHash('sha256').update(v).digest('hex');

export type CreateContributionInput = {
  campaignId: string;
  songId: string;
  supportType: 'fan' | 'business';
  amountCents: number;
  tierId?: string | null;
  supporter?: {
    email: string;
    displayName?: string | null;
    isAnonymous?: boolean;
    instagram?: string | null;
    city?: string | null;
    country?: string | null;
  };
  sponsorId?: string | null;
  consent: { version: string; text: string; ipHash?: string; userAgent?: string };
  referralLinkId?: string | null;
  providerId?: ProviderId;
  simulateCard?: string;
  customerEmail?: string;
  description?: string;
  captureMethod?:
    | 'automatic'
    | 'manual';
  idempotencyKey?: string;
};

export type CreateContributionResult = {
  contributionId: string;
  transactionId: string;
  intentId: string;
  clientSecret?: string;
};

/**
 * Creates the contribution and its transaction in `initiated`. No ledger entry
 * is written here — a ledger row means money actually moved, and nothing has
 * moved yet. That invariant is what lets every public total be a plain SUM
 * with no state filtering.
 */
export async function createContribution(
  input: CreateContributionInput,
): Promise<CreateContributionResult> {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error('amountCents must be a positive integer');
  }

  const provider = getProvider(input.providerId);
  const key = input.idempotencyKey ?? randomUUID();

  const existing = await dbw.select().from(s.idempotencyKeys).where(eq(s.idempotencyKeys.key, key)).limit(1);
  if (existing.length) return existing[0].result as unknown as CreateContributionResult;

  const intent =
    await provider.createIntent({
      amountCents:
        input.amountCents,
      currency: 'USD',
      simulateCard:
        input.simulateCard,
      customerEmail:
        input.customerEmail,
      description:
        input.description,
      captureMethod:
        input.captureMethod,
      idempotencyKey: key,
      metadata: {
        campaign_id:
          input.campaignId,
        song_id:
          input.songId,
        support_type:
          input.supportType,
        tier:
          input.tierId ?? '',
      },
    });


  const result = await dbw.transaction(async (tx) => {
    let supporterId: string | null = null;

    if (input.supporter) {
      const emailHash = sha(input.supporter.email.trim().toLowerCase());
      const [found] = await tx.select().from(s.supporters).where(eq(s.supporters.emailHash, emailHash)).limit(1);
      if (found) {
        supporterId = found.id;
      } else {
        const [created] = await tx.insert(s.supporters).values({
          emailHash,
          email: input.supporter.email,
          displayName: input.supporter.displayName ?? null,
          isAnonymous: input.supporter.isAnonymous ?? false,
          instagram: input.supporter.instagram ?? null,
          city: input.supporter.city ?? null,
          country: input.supporter.country ?? null,
          moderation: 'pending',
        }).returning({ id: s.supporters.id });
        supporterId = created.id;
      }
    }

    const [contribution] = await tx.insert(s.contributions).values({
      campaignId: input.campaignId,
      songId: input.songId,
      supporterId,
      sponsorId: input.sponsorId ?? null,
      supportType: input.supportType,
      tierId: input.tierId ?? null,
      amountCents: input.amountCents,
      displayNameSnapshot: input.supporter?.isAnonymous ? null : input.supporter?.displayName ?? null,
      isAnonymous: input.supporter?.isAnonymous ?? false,
      referralLinkId: input.referralLinkId ?? null,
      moderation: 'pending',
      isTest: provider.isSimulated,
    }).returning({ id: s.contributions.id });

    const [transaction] = await tx.insert(s.transactions).values({
      contributionId: contribution.id,
      provider: provider.id,
      providerRef: intent.intentId,
      state: 'initiated',
      amountCents: input.amountCents,
      currency: 'USD',
      isTest: provider.isSimulated,
    }).returning({ id: s.transactions.id });

    await tx.insert(s.consentRecords).values({
      contributionId: contribution.id,
      supportType: input.supportType,
      textVersion: input.consent.version,
      textHash: sha(input.consent.text),
      ipHash: input.consent.ipHash ?? null,
      userAgent: input.consent.userAgent ?? null,
    });

    return {
      contributionId: contribution.id,
      transactionId: transaction.id,
      intentId: intent.intentId,
      clientSecret: intent.clientSecret,
    };
  });

  await dbw.insert(s.idempotencyKeys)
    .values({ key, scope: 'create_contribution', result })
    .onConflictDoNothing();

  return result;
}

export type SettleResult =
  | { ok: true; supporterNumber: number | null; foundingNumber: number | null }
  | { ok: false; code: string; message: string };

/**
 * Captures the payment and, only on success, writes the ledger entry and
 * issues supporter numbers. Idempotent by transaction id — a webhook retry
 * must never mint a second supporter number.
 */
export async function settleContribution(transactionId: string): Promise<SettleResult> {
  const [tx] = await dbw.select().from(s.transactions).where(eq(s.transactions.id, transactionId)).limit(1);
  if (!tx) return { ok: false, code: 'not_found', message: 'Transaction not found.' };
if (tx.state === 'settled') {
  const existing = await dbw
    .select({
      seriesKey:
        s.supporterNumbers.seriesKey,
      number:
        s.supporterNumbers.number,
    })
    .from(s.supporterNumbers)
    .where(
      eq(
        s.supporterNumbers.contributionId,
        tx.contributionId,
      ),
    );

  return {
    ok: true,
    supporterNumber:
      existing.find(
        (number) =>
          number.seriesKey ===
          'supporter',
      )?.number ?? null,
    foundingNumber:
      existing.find(
        (number) =>
          number.seriesKey ===
          'founding',
      )?.number ?? null,
  };
}


  const provider = getProvider(tx.provider);
  const outcome = await provider.capture(tx.providerRef ?? '');

  if (outcome.status === 'failed') {
    await dbw.update(s.transactions)
      .set({ state: 'failed', failureCode: outcome.code, updatedAt: new Date() })
      .where(eq(s.transactions.id, transactionId));
    return { ok: false, code: outcome.code, message: outcome.message };
  }

  if (outcome.status === 'pending') {
    await dbw.update(s.transactions)
      .set({ state: 'authorized', authorizedAt: new Date(), updatedAt: new Date() })
      .where(eq(s.transactions.id, transactionId));
    return { ok: false, code: 'pending', message: 'Payment is still processing.' };
  }

  return dbw.transaction(async (t) => {
    /*
     * Serialize final settlement by transaction ID.
     * Stripe may retry a webhook while an admin
     * capture or another webhook is still running.
     */
    await t.execute(sql`
      select pg_advisory_xact_lock(
        hashtextextended(
          ${transactionId},
          0
        )
      )
    `);

    const [current] =
      await t
        .select()
        .from(s.transactions)
        .where(
          eq(
            s.transactions.id,
            transactionId,
          ),
        )
        .limit(1);

    if (!current) {
      return {
        ok: false as const,
        code: 'not_found',
        message:
          'Transaction not found.',
      };
    }

    if (
      current.state ===
      'settled'
    ) {
      const existingNumbers =
        await t
          .select({
            seriesKey:
              s.supporterNumbers
                .seriesKey,
            number:
              s.supporterNumbers
                .number,
          })
          .from(
            s.supporterNumbers,
          )
          .where(
            eq(
              s.supporterNumbers
                .contributionId,
              current.contributionId,
            ),
          );

      return {
        ok: true as const,
        supporterNumber:
          existingNumbers.find(
            (number) =>
              number.seriesKey ===
              'supporter',
          )?.number ?? null,
        foundingNumber:
          existingNumbers.find(
            (number) =>
              number.seriesKey ===
              'founding',
          )?.number ?? null,
      };
    }

    const now = new Date();

    await t
      .update(s.transactions)
      .set({
        state: 'settled',
        providerRef:
          outcome.providerRef,
        failureCode: null,
        capturedAt: now,
        settledAt: now,
        updatedAt: now,
      })
      .where(
        eq(
          s.transactions.id,
          transactionId,
        ),
      );

    const [contribution] =
      await t
        .select()
        .from(s.contributions)
        .where(
          eq(
            s.contributions.id,
            current.contributionId,
          ),
        )
        .limit(1);

    if (!contribution) {
      throw new Error(
        'Contribution not found during settlement.',
      );
    }


    await t.insert(s.ledgerEntries).values({
      campaignId: contribution.campaignId,
      contributionId: contribution.id,
      transactionId,
      supporterId: contribution.supporterId,
      sponsorId: contribution.sponsorId,
      kind: 'contribution',
      amountCents: contribution.amountCents,
      occurredAt: now,
    });

    // Sequential per campaign and series. Computed inside the transaction so
    // two simultaneous checkouts cannot be issued the same number.
const nextNumber = async (
  seriesKey: string,
) => {
  // Serialise number issuance per campaign and
  // series. Without this lock, simultaneous
  // settlements can both read the same MAX value.
  await t.execute(sql`
    select pg_advisory_xact_lock(
      hashtextextended(
        ${`${contribution.campaignId}:${seriesKey}`},
        0
      )
    )
  `);

  const [row] = await t
    .select({
      max: sql<number>`
        coalesce(
          max(${s.supporterNumbers.number}),
          0
        )
      `,
    })
    .from(s.supporterNumbers)
    .where(
      sql`
        ${s.supporterNumbers.campaignId}
          = ${contribution.campaignId}
        and
        ${s.supporterNumbers.seriesKey}
          = ${seriesKey}
      `,
    );

  return Number(row.max) + 1;
};


    let supporterNumber: number | null = null;
    let foundingNumber: number | null = null;

    if (contribution.supportType === 'fan') {
      supporterNumber = await nextNumber('supporter');
      await t.insert(s.supporterNumbers).values({
        campaignId: contribution.campaignId, contributionId: contribution.id,
        seriesKey: 'supporter', number: supporterNumber, issuedAt: now,
      });

      if (contribution.amountCents >= 25_000) {
        const candidate = await nextNumber('founding');
        if (candidate <= 100) {
          foundingNumber = candidate;
          await t.insert(s.supporterNumbers).values({
            campaignId: contribution.campaignId, contributionId: contribution.id,
            seriesKey: 'founding', number: candidate, issuedAt: now,
          });
        }
      }
    }

    await t.insert(s.journeyEvents).values({
      songId: contribution.songId,
      campaignId: contribution.campaignId,
      kind: contribution.supportType === 'business' ? 'new_top_sponsor' : 'supporter_milestone',
      title: contribution.supportType === 'business' ? 'New partner joined the campaign' : 'New supporter joined',
      occurredAt: now,
      isAuto: true,
      isVisible: false, // surfaced only when a milestone rule promotes it
    });

    return { ok: true as const, supporterNumber, foundingNumber };
  });
}

/**
 * Records a refund as a NEGATIVE ledger entry. The original entry is never
 * touched — that is what makes rankings recompute correctly rather than
 * approximately, and it leaves a real audit trail.
 */
export async function refundContribution(args: {
  transactionId: string;
  amountCents: number;
  reason: RefundReasonCode;
  note?: string;
  adminUserId?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const [tx] = await dbw.select().from(s.transactions).where(eq(s.transactions.id, args.transactionId)).limit(1);
  if (!tx) return { ok: false, message: 'Transaction not found.' };
  if (tx.state !== 'settled' && tx.state !== 'partially_refunded') {
    return { ok: false, message: `Cannot refund from ${tx.state}.` };
  }

  const [net] = await dbw.select({ total: sql<number>`coalesce(sum(${s.ledgerEntries.amountCents}), 0)::int` })
    .from(s.ledgerEntries).where(eq(s.ledgerEntries.transactionId, args.transactionId));
  if (args.amountCents > Number(net.total)) return { ok: false, message: 'Refund exceeds remaining balance.' };

  const provider = getProvider(tx.provider);
  const outcome = await provider.refund(tx.providerRef ?? '', args.amountCents, args.reason);
  if (outcome.status === 'failed') return { ok: false, message: outcome.message };

  await dbw.transaction(async (t) => {
    const now = new Date();
    const [contribution] = await t.select().from(s.contributions)
      .where(eq(s.contributions.id, tx.contributionId)).limit(1);

    await t.insert(s.refunds).values({
      transactionId: args.transactionId, amountCents: args.amountCents,
      reason: args.reason, note: args.note ?? null,
      adminUserId: args.adminUserId ?? null, providerRef: outcome.providerRef,
    });

    await t.insert(s.ledgerEntries).values({
      campaignId: contribution.campaignId, contributionId: contribution.id,
      transactionId: args.transactionId, supporterId: contribution.supporterId,
      sponsorId: contribution.sponsorId, kind: 'refund',
      amountCents: -args.amountCents, occurredAt: now,
      note: args.note ?? null,
    });

    const remaining = Number(net.total) - args.amountCents;
    await t.update(s.transactions)
      .set({ state: remaining <= 0 ? 'refunded' : 'partially_refunded', updatedAt: now })
      .where(eq(s.transactions.id, args.transactionId));

    await t.insert(s.auditLog).values({
      adminUserId: args.adminUserId ?? null,
      action: 'refund', entity: 'transaction', entityId: args.transactionId,
      before: { state: tx.state, netCents: Number(net.total) },
      after: { state: remaining <= 0 ? 'refunded' : 'partially_refunded', netCents: remaining },
      reason: args.reason,
    });
  });

  return { ok: true };
}
