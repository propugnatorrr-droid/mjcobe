import 'server-only';

import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { getProvider } from '@/lib/payments';
import {
  settleContribution,
} from '@/lib/ledger/contributions';
import {
  reconcileAction,
} from '@/lib/reconciliation/audit';
import { recordAudit } from '@/lib/audit/log';

export type ReconcileReport = {
  checked: number;
  settled: number;
  markedFailed: number;
  escalated: number;
  escalations: {
    transactionId: string;
    localState: string;
    providerState: string | null;
    ledgerCents: number;
    amountCents: number;
  }[];
};

/**
 * Compares open transactions against the provider and repairs only what is
 * unambiguous. Anything requiring judgement is escalated, never guessed.
 */
export async function runReconciliation(
  limit = 50,
): Promise<ReconcileReport> {
  const rows = await db
    .select({
      transactionId: s.transactions.id,
      contributionId:
        s.transactions.contributionId,
      state: s.transactions.state,
      amountCents:
        s.transactions.amountCents,
      providerId:
        s.transactions.providerId,
      intentId:
        s.transactions.providerIntentId,
      createdAt:
        s.transactions.createdAt,
      ledgerCents: sql<number>`
        coalesce((
          select sum(le.amount_cents)
          from ledger_entries le
          where le.contribution_id =
            ${s.transactions.contributionId}
        ), 0)::int
      `,
    })
    .from(s.transactions)
    .where(
      inArray(s.transactions.state, [
        'initiated',
        'authorized',
        'captured',
        'settled',
      ]),
    )
    .limit(limit);

  const report: ReconcileReport = {
    checked: 0,
    settled: 0,
    markedFailed: 0,
    escalated: 0,
    escalations: [],
  };

  for (const row of rows) {
    report.checked += 1;

    let providerState:
      string | null = null;

    try {
      const provider = getProvider(
        row.providerId,
      );

      providerState =
        row.intentId
          ? await provider.readIntentState(
              row.intentId,
            )
          : null;
    } catch {
      providerState = null;
    }

    const ageHours =
      (Date.now() -
        row.createdAt.getTime()) /
      3_600_000;

    const action = reconcileAction({
      localState: row.state,
      providerState,
      ledgerCents: Number(
        row.ledgerCents ?? 0,
      ),
      amountCents: row.amountCents,
      ageHours,
    });

    if (action === 'settle') {
      const result =
        await settleContribution(
          row.transactionId,
        );

      if (result.ok) {
        report.settled += 1;
      }

      continue;
    }

    if (action === 'mark_failed') {
      await db
        .update(s.transactions)
        .set({
          state: 'failed',
          updatedAt: new Date(),
        })
        .where(
          eq(
            s.transactions.id,
            row.transactionId,
          ),
        );

      report.markedFailed += 1;
      continue;
    }

    if (
      action === 'escalate' ||
      action === 'refund_ledger'
    ) {
      report.escalated += 1;

      report.escalations.push({
        transactionId:
          row.transactionId,
        localState: row.state,
        providerState,
        ledgerCents: Number(
          row.ledgerCents ?? 0,
        ),
        amountCents: row.amountCents,
      });

      await recordAudit({
        action:
          'reconciliation.escalated',
        entity: 'transaction',
        entityId: row.transactionId,
        after: {
          localState: row.state,
          providerState,
          ledgerCents: Number(
            row.ledgerCents ?? 0,
          ),
          amountCents:
            row.amountCents,
          decision: action,
        },
      });
    }
  }

  return report;
}
