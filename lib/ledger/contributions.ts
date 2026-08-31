import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import {
  settledLeaderboard,
} from '@/lib/ranking/settled';
import {
  queueOutbidNotification,
} from '@/lib/notifications/outbid';
import {
  settlementModerationForName,
} from '@/lib/moderation/settlement';
import {
  and,
  eq,
  inArray,
  sql,
} from 'drizzle-orm';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { getProvider } from '@/lib/payments';
import {
  sendContributionConfirmation,
} from '@/lib/notifications/outbox';
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
  if (
    !Number.isInteger(input.amountCents) ||
    input.amountCents <= 0
  ) {
    throw new Error(
      'amountCents must be a positive integer',
    );
  }

  const provider = getProvider(
    input.providerId,
  );

  const key =
    input.idempotencyKey ??
    randomUUID();

  /*
   * The scope binds an attempt key to the
   * immutable payment details. A caller may
   * safely retry the same request, but may
   * not reuse the key for another campaign,
   * amount, tier, sponsor, or supporter.
   */
  const payloadHash = sha(
    JSON.stringify({
      campaignId:
        input.campaignId,
      songId:
        input.songId,
      supportType:
        input.supportType,
      amountCents:
        input.amountCents,
      tierId:
        input.tierId ?? null,
      supporterEmailHash:
        input.supporter
          ? sha(
              input.supporter.email
                .trim()
                .toLowerCase(),
            )
          : null,
      sponsorId:
        input.sponsorId ?? null,
      referralLinkId:
        input.referralLinkId ??
        null,
      providerId:
        provider.id,
      captureMethod:
        input.captureMethod ??
        'automatic',
    }),
  );

  const scope =
    `create_contribution:${payloadHash}`;

  /*
   * The advisory transaction lock closes the
   * race between:
   *
   * 1. checking idempotency_keys,
   * 2. creating the provider intent,
   * 3. creating local contribution rows, and
   * 4. recording the idempotency result.
   *
   * Requests carrying the same key therefore
   * execute this section one at a time.
   */
  return dbw.transaction(
    async (tx) => {
      await tx.execute(sql`
        select pg_advisory_xact_lock(
          hashtext(${key})
        )
      `);

      const [existing] =
        await tx
          .select()
          .from(
            s.idempotencyKeys,
          )
          .where(
            eq(
              s.idempotencyKeys.key,
              key,
            ),
          )
          .limit(1);

      if (existing) {
        if (
          existing.scope !==
          scope
        ) {
          throw new Error(
            'Checkout attempt key was reused with different payment details.',
          );
        }

        if (
          !existing.result
        ) {
          throw new Error(
            'Checkout attempt has no stored result.',
          );
        }

        return existing.result as unknown as CreateContributionResult;
      }

      /*
       * The database attempt lock is already
       * held. The same key is also sent to the
       * payment provider, giving both the
       * local database and Stripe the same
       * idempotency boundary.
       */
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
          idempotencyKey:
            key,
          metadata: {
            campaign_id:
              input.campaignId,
            song_id:
              input.songId,
            support_type:
              input.supportType,
            tier:
              input.tierId ??
              '',
          },
        });

      let supporterId:
        string | null = null;

      if (input.supporter) {
        const emailHash = sha(
          input.supporter.email
            .trim()
            .toLowerCase(),
        );

        const [found] =
          await tx
            .select()
            .from(s.supporters)
            .where(
              eq(
                s.supporters
                  .emailHash,
                emailHash,
              ),
            )
            .limit(1);

        if (found) {
          supporterId =
            found.id;
        } else {
          const [created] =
            await tx
              .insert(
                s.supporters,
              )
              .values({
                emailHash,
                email:
                  input.supporter
                    .email,
                displayName:
                  input.supporter
                    .displayName ??
                  null,
                isAnonymous:
                  input.supporter
                    .isAnonymous ??
                  false,
                instagram:
                  input.supporter
                    .instagram ??
                  null,
                city:
                  input.supporter
                    .city ?? null,
                country:
                  input.supporter
                    .country ??
                  null,
                moderation:
                  'pending',
              })
              .returning({
                id:
                  s.supporters.id,
              });

          supporterId =
            created.id;
        }
      }

      const [contribution] =
        await tx
          .insert(
            s.contributions,
          )
          .values({
            campaignId:
              input.campaignId,
            songId:
              input.songId,
            supporterId,
            sponsorId:
              input.sponsorId ??
              null,
            supportType:
              input.supportType,
            tierId:
              input.tierId ??
              null,
            amountCents:
              input.amountCents,
            displayNameSnapshot:
              input.supporter
                ?.isAnonymous
                ? null
                : input
                    .supporter
                    ?.displayName ??
                  null,
            isAnonymous:
              input.supporter
                ?.isAnonymous ??
              false,
            referralLinkId:
              input.referralLinkId ??
              null,
            moderation:
              'pending',
            isTest:
              provider.isSimulated,
          })
          .returning({
            id:
              s.contributions.id,
          });

      const [transaction] =
        await tx
          .insert(
            s.transactions,
          )
          .values({
            contributionId:
              contribution.id,
            provider:
              provider.id,
            providerRef:
              intent.intentId,
            state:
              'initiated',
            amountCents:
              input.amountCents,
            currency: 'USD',
            isTest:
              provider.isSimulated,
          })
          .returning({
            id:
              s.transactions.id,
          });

      await tx
        .insert(
          s.consentRecords,
        )
        .values({
          contributionId:
            contribution.id,
          supportType:
            input.supportType,
          textVersion:
            input.consent
              .version,
          textHash: sha(
            input.consent.text,
          ),
          ipHash:
            input.consent
              .ipHash ?? null,
          userAgent:
            input.consent
              .userAgent ??
            null,
        });

      const result:
        CreateContributionResult =
        {
          contributionId:
            contribution.id,
          transactionId:
            transaction.id,
          intentId:
            intent.intentId,
          clientSecret:
            intent.clientSecret,
        };

      await tx
        .insert(
          s.idempotencyKeys,
        )
        .values({
          key,
          scope,
          result,
        });

      return result;
    },
  );
}

export type SettleResult =
  | { ok: true; supporterNumber: number | null; foundingNumber: number | null }
  | { ok: false; code: string; message: string };

export type CancelResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

/**
 * Cancels an initiated or authorized payment with the provider before marking
 * the local transaction as canceled. This is especially important for Stripe
 * manual-capture sponsorships because changing only the database would leave
 * the customer's authorization open.
 */
export async function cancelContribution(
  transactionId: string,
): Promise<CancelResult> {
  const [transaction] = await dbw
    .select()
    .from(s.transactions)
    .where(
      eq(
        s.transactions.id,
        transactionId,
      ),
    )
    .limit(1);

  if (!transaction) {
    return {
      ok: false,
      code: 'not_found',
      message: 'Transaction not found.',
    };
  }

  if (
    transaction.state === 'canceled'
  ) {
    return {
      ok: true,
    };
  }

  if (
    transaction.state !== 'initiated' &&
    transaction.state !== 'authorized' &&
    transaction.state !== 'failed'
  ) {
    return {
      ok: false,
      code: 'not_cancelable',
      message:
        `Cannot cancel a transaction in ${transaction.state}.`,
    };
  }

  if (!transaction.providerRef) {
    return {
      ok: false,
      code: 'missing_provider_reference',
      message:
        'The transaction has no payment provider reference.',
    };
  }

  const provider = getProvider(
    transaction.provider,
  );

  const outcome = await provider.cancel(
    transaction.providerRef,
  );

  if (outcome.status === 'failed') {
    return {
      ok: false,
      code: outcome.code,
      message: outcome.message,
    };
  }

  if (outcome.status === 'pending') {
    return {
      ok: false,
      code: 'pending',
      message:
        'Payment cancellation is still processing.',
    };
  }

  await dbw
    .update(s.transactions)
    .set({
      state: 'canceled',
      providerRef:
        outcome.providerRef,
      failureCode: null,
      updatedAt: new Date(),
    })
    .where(
      eq(
        s.transactions.id,
        transactionId,
      ),
    );

  return {
    ok: true,
  };
}

/**
 * Captures the payment and, only on success, writes the ledger entry and
 * issues supporter numbers. Idempotent by transaction id — a webhook retry
 * must never mint a second supporter number.
 */
export async function settleContribution(transactionId: string): Promise<SettleResult> {
  const [tx] = await dbw.select().from(s.transactions).where(eq(s.transactions.id, transactionId)).limit(1);
  if (!tx) return { ok: false, code: 'not_found', message: 'Transaction not found.' };
  if (
    tx.state ===
    'settled'
  ) {
    const existing =
      await dbw
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
  const [settlingContribution] =
    await dbw
      .select()
      .from(s.contributions)
      .where(
        eq(
          s.contributions.id,
          tx.contributionId,
        ),
      )
      .limit(1);

  const previousLeader =
    settlingContribution
      ? (
          await settledLeaderboard({
            campaignId:
              settlingContribution
                .campaignId,
            supportType:
              settlingContribution
                .supportType,
            limit: 1,
          })
        )[0] ?? null
      : null;

    const result = {
      ok: true as const,

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

    /*
     * This also repairs the notification outbox
     * if settlement succeeded previously but the
     * process stopped before enqueueing email.
     */
    await sendContributionConfirmation(
      transactionId,
    );

    return result;
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

  const result =
    await dbw.transaction(
      async (t) => {
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
    /*
     * Public identity is decided only after
     * settlement. Anonymous support may count
     * financially while revealing no identity.
     */
    if (
      contribution.supportType ===
      'fan'
    ) {
      const moderation =
        settlementModerationForName(
          contribution
            .displayNameSnapshot,
        );

      await t
        .update(
          s.contributions,
        )
        .set({
          moderation,
          leaderboardVisible:
            moderation ===
              'approved',
        })
        .where(
          eq(
            s.contributions.id,
            contribution.id,
          ),
        );

      if (
        contribution.supporterId
      ) {
        await t
          .update(
            s.supporters,
          )
          .set({
            moderation,
          })
          .where(
            eq(
              s.supporters.id,
              contribution
                .supporterId,
            ),
          );
      }
    } else {
      /*
       * A business reaches settlement only
       * after automatic approval or a manual
       * capture approved by management.
       */
      await t
        .update(
          s.contributions,
        )
        .set({
          moderation:
            'approved',
          leaderboardVisible:
            true,
        })
        .where(
          eq(
            s.contributions.id,
            contribution.id,
          ),
        );

      if (
        contribution.sponsorId
      ) {
        await t
          .update(s.sponsors)
          .set({
            moderation:
              'approved',
          })
          .where(
            eq(
              s.sponsors.id,
              contribution
                .sponsorId,
            ),
          );
      }
    }


    await t
      .insert(
        s.ledgerEntries,
      )
      .values({
        campaignId:
          contribution.campaignId,
        contributionId:
          contribution.id,
        transactionId,
        supporterId:
          contribution.supporterId,
        sponsorId:
          contribution.sponsorId,
        kind: 'contribution',
        amountCents:
          contribution.amountCents,
        externalRef:
          `settlement:${transactionId}`,
        occurredAt: now,
      })
      .onConflictDoNothing();


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

    return {
      ok: true as const,
      supporterNumber,
      foundingNumber,
    };
  });

  if (result.ok) {
    /*
     * Settlement is already committed. An email
     * outage must never roll back or alter the
     * successful payment.
     */
    await sendContributionConfirmation(
      transactionId,
    );
  }
  if (
    result.ok &&
    settlingContribution
  ) {
    await queueOutbidNotification({
      campaignId:
        settlingContribution
          .campaignId,
      supportType:
        settlingContribution
          .supportType,
      winningContributionId:
        settlingContribution.id,
      previousLeaderId:
        previousLeader
          ?.identityId ??
        null,
    });
  }

  return result;
}

const refundReasons:

ReadonlySet<RefundReasonCode> =
  new Set([
    'unverified_sponsor',
    'fraud_risk',
    'brand_safety',
    'duplicate_payment',
    'customer_request',
    'other',
  ]);

function validRefundReason(
  value: string | undefined,
): RefundReasonCode {
  if (
    value &&
    refundReasons.has(
      value as RefundReasonCode,
    )
  ) {
    return value as RefundReasonCode;
  }

  return 'other';
}

async function updateTransactionFromLedger(
  database:
    Parameters<
      Parameters<
        typeof dbw.transaction
      >[0]
    >[0],
  transactionId: string,
  originalAmountCents: number,
) {
  const [balance] =
    await database
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

  const netCents =
    Number(balance?.total ?? 0);

  const state =
    netCents <= 0
      ? 'refunded'
      : netCents <
          originalAmountCents
        ? 'partially_refunded'
        : 'settled';

  await database
    .update(s.transactions)
    .set({
      state,
      updatedAt: new Date(),
    })
    .where(
      eq(
        s.transactions.id,
        transactionId,
      ),
    );

  return {
    netCents,
    state,
  };
}

export type ReconcileRefundInput = {
  providerRef: string;
  localRefundId?: string | null;
  paymentIntentId?: string | null;
  amountCents: number;
  status: string;
  failureReason?: string | null;
  reason?: string;
};

/**
 * Reconciles both application-created and
 * Stripe-Dashboard-created refunds.
 *
 * A negative ledger entry is written only
 * after Stripe reports succeeded. Pending
 * refunds reserve balance but do not change
 * public totals. A later failure reverses any
 * previously posted refund movement without
 * deleting ledger history.
 */
export async function reconcileRefund(
  input: ReconcileRefundInput,
): Promise<{
  ok: boolean;
  message?: string;
}> {
  let [refund] =
    await dbw
      .select()
      .from(s.refunds)
      .where(
        eq(
          s.refunds.providerRef,
          input.providerRef,
        ),
      )
      .limit(1);

  if (
    !refund &&
    input.localRefundId &&
    /^[0-9a-f-]{36}$/i.test(
      input.localRefundId,
    )
  ) {
    [refund] =
      await dbw
        .select()
        .from(s.refunds)
        .where(
          eq(
            s.refunds.id,
            input.localRefundId,
          ),
        )
        .limit(1);
  }

  if (!refund) {
    if (!input.paymentIntentId) {
      return {
        ok: false,
        message:
          'Refund has no PaymentIntent reference.',
      };
    }

    const [transaction] =
      await dbw
        .select()
        .from(s.transactions)
        .where(
          and(
            eq(
              s.transactions.provider,
              'stripe',
            ),
            eq(
              s.transactions.providerRef,
              input.paymentIntentId,
            ),
          ),
        )
        .limit(1);

    if (!transaction) {
      return {
        ok: false,
        message:
          'No local transaction matches the Stripe refund.',
      };
    }

    const [created] =
      await dbw
        .insert(s.refunds)
        .values({
          transactionId:
            transaction.id,
          amountCents:
            input.amountCents,
          reason:
            validRefundReason(
              input.reason,
            ),
          note:
            'Created directly in Stripe.',
          providerRef:
            input.providerRef,
          status:
            input.status,
          failureReason:
            input.failureReason ??
            null,
          updatedAt:
            new Date(),
        })
        .onConflictDoNothing()
        .returning();

    if (created) {
      refund = created;
    } else {
      [refund] =
        await dbw
          .select()
          .from(s.refunds)
          .where(
            eq(
              s.refunds.providerRef,
              input.providerRef,
            ),
          )
          .limit(1);
    }
  }

  if (!refund) {
    return {
      ok: false,
      message:
        'Refund reconciliation failed.',
    };
  }

  return dbw.transaction(
    async (database) => {
      await database.execute(sql`
        select pg_advisory_xact_lock(
          hashtextextended(
            ${refund.id},
            0
          )
        )
      `);

      const [currentRefund] =
        await database
          .select()
          .from(s.refunds)
          .where(
            eq(
              s.refunds.id,
              refund.id,
            ),
          )
          .limit(1);

      if (!currentRefund) {
        return {
          ok: false,
          message:
            'Refund record disappeared during reconciliation.',
        };
      }

      const [transaction] =
        await database
          .select()
          .from(s.transactions)
          .where(
            eq(
              s.transactions.id,
              currentRefund.transactionId,
            ),
          )
          .limit(1);

      if (!transaction) {
        return {
          ok: false,
          message:
            'Refund transaction was not found.',
        };
      }

      const [contribution] =
        await database
          .select()
          .from(s.contributions)
          .where(
            eq(
              s.contributions.id,
              transaction.contributionId,
            ),
          )
          .limit(1);

      if (!contribution) {
        return {
          ok: false,
          message:
            'Refund contribution was not found.',
        };
      }

      await database
        .update(s.refunds)
        .set({
          providerRef:
            input.providerRef,
          amountCents:
            input.amountCents,
          status:
            input.status,
          failureReason:
            input.failureReason ??
            null,
          updatedAt:
            new Date(),
        })
        .where(
          eq(
            s.refunds.id,
            currentRefund.id,
          ),
        );

      const succeeded =
        input.status ===
        'succeeded';

      const failed =
        input.status ===
          'failed' ||
        input.status ===
          'canceled';

      if (succeeded) {
        await database
          .insert(
            s.ledgerEntries,
          )
          .values({
            campaignId:
              contribution.campaignId,
            contributionId:
              contribution.id,
            transactionId:
              transaction.id,
            refundId:
              currentRefund.id,
            supporterId:
              contribution.supporterId,
            sponsorId:
              contribution.sponsorId,
            kind: 'refund',
            amountCents:
              -input.amountCents,
            note:
              currentRefund.note,
            externalRef:
              `refund:${input.providerRef}:succeeded`,
            occurredAt:
              new Date(),
          })
          .onConflictDoNothing();

        const updated =
          await updateTransactionFromLedger(
            database,
            transaction.id,
            transaction.amountCents,
          );

        await database
          .insert(s.auditLog)
          .values({
            adminUserId:
              currentRefund.adminUserId,
            action:
              'refund.succeeded',
            entity:
              'transaction',
            entityId:
              transaction.id,
            before: {
              refundStatus:
                currentRefund.status,
            },
            after: {
              refundStatus:
                'succeeded',
              netCents:
                updated.netCents,
              transactionState:
                updated.state,
            },
            reason:
              currentRefund.reason,
          });
      }

      if (failed) {
        const [posted] =
          await database
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
                s.ledgerEntries.refundId,
                currentRefund.id,
              ),
            );

        const postedCents =
          Number(
            posted?.total ?? 0,
          );

        if (postedCents < 0) {
          await database
            .insert(
              s.ledgerEntries,
            )
            .values({
              campaignId:
                contribution.campaignId,
              contributionId:
                contribution.id,
              transactionId:
                transaction.id,
              refundId:
                currentRefund.id,
              supporterId:
                contribution.supporterId,
              sponsorId:
                contribution.sponsorId,
              kind: 'adjustment',
              amountCents:
                -postedCents,
              note:
                `Refund failed: ${
                  input.failureReason ??
                  'unknown'
                }`,
              externalRef:
                `refund:${input.providerRef}:failed`,
              occurredAt:
                new Date(),
            })
            .onConflictDoNothing();
        }

        const updated =
          await updateTransactionFromLedger(
            database,
            transaction.id,
            transaction.amountCents,
          );

        await database
          .insert(s.auditLog)
          .values({
            adminUserId:
              currentRefund.adminUserId,
            action:
              'refund.failed',
            entity:
              'transaction',
            entityId:
              transaction.id,
            before: {
              refundStatus:
                currentRefund.status,
            },
            after: {
              refundStatus:
                input.status,
              failureReason:
                input.failureReason ??
                null,
              netCents:
                updated.netCents,
              transactionState:
                updated.state,
            },
            reason:
              currentRefund.reason,
          });
      }

      return {
        ok: true,
      };
    },
  );
}

/**
 * Reserves the requested balance before
 * contacting the provider. This prevents two
 * simultaneous administrators from refunding
 * more than the remaining transaction balance.
 */
export async function refundContribution(
  args: {
    transactionId: string;
    amountCents: number;
    reason:
      RefundReasonCode;
    note?: string;
    adminUserId?: string;
  },
): Promise<{
  ok: boolean;
  message?: string;
}> {
  if (
    !Number.isInteger(
      args.amountCents,
    ) ||
    args.amountCents <= 0
  ) {
    return {
      ok: false,
      message:
        'Refund amount must be greater than zero.',
    };
  }

  const reservation =
    await dbw.transaction(
      async (database) => {
        await database.execute(sql`
          select pg_advisory_xact_lock(
            hashtextextended(
              ${args.transactionId},
              0
            )
          )
        `);

        const [transaction] =
          await database
            .select()
            .from(s.transactions)
            .where(
              eq(
                s.transactions.id,
                args.transactionId,
              ),
            )
            .limit(1);

        if (!transaction) {
          return {
            ok: false as const,
            message:
              'Transaction not found.',
          };
        }

        if (
          transaction.state !==
            'settled' &&
          transaction.state !==
            'partially_refunded'
        ) {
          return {
            ok: false as const,
            message:
              `Cannot refund from ${transaction.state}.`,
          };
        }

        const [net] =
          await database
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
                s.ledgerEntries.transactionId,
                args.transactionId,
              ),
            );

        const [reserved] =
          await database
            .select({
              total: sql<number>`
                coalesce(
                  sum(
                    ${s.refunds.amountCents}
                  ),
                  0
                )::int
              `,
            })
            .from(s.refunds)
            .where(
              and(
                eq(
                  s.refunds.transactionId,
                  args.transactionId,
                ),
                inArray(
                  s.refunds.status,
                  [
                    'creating',
                    'pending',
                    'requires_action',
                  ],
                ),
              ),
            );

        const netCents =
          Number(
            net?.total ?? 0,
          );

        const reservedCents =
          Number(
            reserved?.total ?? 0,
          );

        const availableCents =
          netCents -
          reservedCents;

        if (
          args.amountCents >
          availableCents
        ) {
          return {
            ok: false as const,
            message:
              'Refund exceeds the remaining available balance.',
          };
        }

        const [refund] =
          await database
            .insert(s.refunds)
            .values({
              transactionId:
                transaction.id,
              amountCents:
                args.amountCents,
              reason:
                args.reason,
              note:
                args.note ??
                null,
              adminUserId:
                args.adminUserId ??
                null,
              status:
                'creating',
              updatedAt:
                new Date(),
            })
            .returning();

        await database
          .insert(s.auditLog)
          .values({
            adminUserId:
              args.adminUserId ??
              null,
            action:
              'refund.requested',
            entity:
              'transaction',
            entityId:
              transaction.id,
            before: {
              state:
                transaction.state,
              netCents,
              reservedCents,
            },
            after: {
              refundId:
                refund.id,
              amountCents:
                args.amountCents,
              status:
                'creating',
            },
            reason:
              args.reason,
          });

        return {
          ok: true as const,
          transaction,
          refund,
        };
      },
    );

  if (!reservation.ok) {
    return reservation;
  }

  const provider =
    getProvider(
      reservation
        .transaction
        .provider,
    );

  const outcome =
    await provider.refund(
      reservation
        .transaction
        .providerRef ??
        '',
      args.amountCents,
      args.reason,
      reservation.refund.id,
    );

  if (
    outcome.status ===
    'failed'
  ) {
    await dbw
      .update(s.refunds)
      .set({
        providerRef:
          outcome.providerRef,
        status: 'failed',
        failureReason:
          outcome.code,
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          s.refunds.id,
          reservation.refund.id,
        ),
      );

    return {
      ok: false,
      message:
        outcome.message,
    };
  }

  const reconciled =
    await reconcileRefund({
      providerRef:
        outcome.providerRef,
      localRefundId:
        reservation.refund.id,
      paymentIntentId:
        reservation
          .transaction
          .providerRef,
      amountCents:
        args.amountCents,
      status:
        outcome.status ===
        'succeeded'
          ? 'succeeded'
          : 'pending',
      reason:
        args.reason,
    });

  if (!reconciled.ok) {
    return reconciled;
  }

  if (
    outcome.status ===
    'pending'
  ) {
    return {
      ok: true,
      message:
        'Refund submitted and awaiting provider confirmation.',
    };
  }

  return {
    ok: true,
  };
}

export type ReconcileDisputeInput = {
  providerRef: string;
  paymentIntentId: string;
  amountCents: number;
  state: string;
  movement:
    | 'none'
    | 'withdrawn'
    | 'reinstated';
};

/**
 * Records Stripe disputes and uses
 * append-only ledger movements when Stripe
 * withdraws or reinstates the disputed funds.
 */
export async function reconcileDispute(
  input: ReconcileDisputeInput,
): Promise<{
  ok: boolean;
  message?: string;
}> {
  const [transaction] =
    await dbw
      .select()
      .from(s.transactions)
      .where(
        and(
          eq(
            s.transactions.provider,
            'stripe',
          ),
          eq(
            s.transactions.providerRef,
            input.paymentIntentId,
          ),
        ),
      )
      .limit(1);

  if (!transaction) {
    return {
      ok: false,
      message:
        'No local transaction matches the Stripe dispute.',
    };
  }

  return dbw.transaction(
    async (database) => {
      await database.execute(sql`
        select pg_advisory_xact_lock(
          hashtextextended(
            ${transaction.id},
            0
          )
        )
      `);

      const [contribution] =
        await database
          .select()
          .from(s.contributions)
          .where(
            eq(
              s.contributions.id,
              transaction.contributionId,
            ),
          )
          .limit(1);

      if (!contribution) {
        return {
          ok: false,
          message:
            'Disputed contribution was not found.',
        };
      }

      const resolvedAt =
        input.state === 'won' ||
        input.state === 'lost'
          ? new Date()
          : null;

      const [existing] =
        await database
          .select()
          .from(s.disputes)
          .where(
            eq(
              s.disputes.providerRef,
              input.providerRef,
            ),
          )
          .limit(1);

      if (existing) {
        await database
          .update(s.disputes)
          .set({
            amountCents:
              input.amountCents,
            state:
              input.state,
            resolvedAt,
          })
          .where(
            eq(
              s.disputes.id,
              existing.id,
            ),
          );
      } else {
        await database
          .insert(s.disputes)
          .values({
            transactionId:
              transaction.id,
            providerRef:
              input.providerRef,
            amountCents:
              input.amountCents,
            state:
              input.state,
            resolvedAt,
          })
          .onConflictDoNothing();
      }

      if (
        input.movement ===
        'withdrawn'
      ) {
        await database
          .insert(
            s.ledgerEntries,
          )
          .values({
            campaignId:
              contribution.campaignId,
            contributionId:
              contribution.id,
            transactionId:
              transaction.id,
            supporterId:
              contribution.supporterId,
            sponsorId:
              contribution.sponsorId,
            kind:
              'chargeback',
            amountCents:
              -input.amountCents,
            note:
              'Stripe dispute funds withdrawn.',
            externalRef:
              `dispute:${input.providerRef}:withdrawn`,
            occurredAt:
              new Date(),
          })
          .onConflictDoNothing();
      }

      if (
        input.movement ===
        'reinstated'
      ) {
        await database
          .insert(
            s.ledgerEntries,
          )
          .values({
            campaignId:
              contribution.campaignId,
            contributionId:
              contribution.id,
            transactionId:
              transaction.id,
            supporterId:
              contribution.supporterId,
            sponsorId:
              contribution.sponsorId,
            kind:
              'adjustment',
            amountCents:
              input.amountCents,
            note:
              'Stripe dispute funds reinstated.',
            externalRef:
              `dispute:${input.providerRef}:reinstated`,
            occurredAt:
              new Date(),
          })
          .onConflictDoNothing();
      }

      if (
        input.movement ===
        'withdrawn'
      ) {
        await database
          .update(s.transactions)
          .set({
            state:
              'charged_back',
            updatedAt:
              new Date(),
          })
          .where(
            eq(
              s.transactions.id,
              transaction.id,
            ),
          );
      } else if (
        input.movement ===
        'reinstated'
      ) {
        await updateTransactionFromLedger(
          database,
          transaction.id,
          transaction.amountCents,
        );
      } else {
        await database
          .update(s.transactions)
          .set({
            state:
              'disputed',
            updatedAt:
              new Date(),
          })
          .where(
            eq(
              s.transactions.id,
              transaction.id,
            ),
          );
      }

      return {
        ok: true,
      };
    },
  );
}
