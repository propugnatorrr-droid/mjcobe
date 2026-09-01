import 'server-only';

import {
  eq,
  inArray,
  sql,
} from 'drizzle-orm';
import {
  db,
} from '@/lib/db/client';
import {
  dbw,
} from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import {
  settleContribution,
} from '@/lib/ledger/contributions';
import {
  reconcileAction,
} from '@/lib/reconciliation/audit';
import {
  readProviderState,
} from '@/lib/payments/status';
import {
  recordAudit,
} from '@/lib/audit/log';

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
 * Compares open transactions with their provider state.
 *
 * Only unambiguous missing settlements and failed payments are repaired.
 * Refund and amount discrepancies are escalated rather than guessed.
 */
export async function runReconciliation(
  limit = 50,
): Promise<ReconcileReport> {
  const safeLimit = Math.max(
    1,
    Math.min(limit, 200),
  );

  const rows = await db
    .select({
      transactionId:
        s.transactions.id,
      contributionId:
        s.transactions.contributionId,
      state:
        s.transactions.state,
      amountCents:
        s.transactions.amountCents,
      provider:
        s.transactions.provider,
      providerRef:
        s.transactions.providerRef,
      createdAt:
        s.transactions.createdAt,
      ledgerCents: sql<number>`
        coalesce((
          select sum(
            le.amount_cents
          )
          from ledger_entries le
          where
            le.contribution_id =
              ${s.transactions.contributionId}
        ), 0)::int
      `,
    })
    .from(s.transactions)
    .where(
      inArray(
        s.transactions.state,
        [
          'initiated',
          'authorized',
          'captured',
          'settled',
          'partially_refunded',
        ],
      ),
    )
    .orderBy(
      s.transactions.createdAt,
    )
    .limit(safeLimit);

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
      providerState =
        await readProviderState({
          provider: row.provider,
          providerRef:
            row.providerRef,
          localState: row.state,
        });
    } catch {
      /*
       * Provider silence is not evidence that
       * payment failed. The pure rule returns
       * no action when providerState is null.
       */
      providerState = null;
    }

    const ledgerCents = Number(
      row.ledgerCents ?? 0,
    );

    const ageHours =
      (Date.now() -
        row.createdAt.getTime()) /
      3_600_000;

    const action =
      reconcileAction({
        localState: row.state,
        providerState,
        ledgerCents,
        amountCents:
          row.amountCents,
        ageHours,
      });

    if (action === 'settle') {
      /*
       * A transaction already marked settled
       * but missing its ledger entry is not sent
       * through settleContribution because that
       * function correctly treats settled as
       * idempotently complete. Escalate that
       * inconsistent database state instead.
       */
      if (row.state === 'settled') {
        report.escalated += 1;

        report.escalations.push({
          transactionId:
            row.transactionId,
          localState: row.state,
          providerState,
          ledgerCents,
          amountCents:
            row.amountCents,
        });

        await recordAudit({
          action:
            'reconciliation.escalated',
          entity: 'transaction',
          entityId:
            row.transactionId,
          after: {
            localState: row.state,
            providerState,
            ledgerCents,
            amountCents:
              row.amountCents,
            decision:
              'settled_without_ledger',
          },
        });

        continue;
      }

      const result =
        await settleContribution(
          row.transactionId,
        );

      if (result.ok) {
        report.settled += 1;
      } else {
        report.escalated += 1;

        report.escalations.push({
          transactionId:
            row.transactionId,
          localState: row.state,
          providerState,
          ledgerCents,
          amountCents:
            row.amountCents,
        });

        await recordAudit({
          action:
            'reconciliation.escalated',
          entity: 'transaction',
          entityId:
            row.transactionId,
          after: {
            localState: row.state,
            providerState,
            ledgerCents,
            amountCents:
              row.amountCents,
            decision:
              'settlement_failed',
            code: result.code,
            message: result.message,
          },
        });
      }

      continue;
    }

    if (action === 'mark_failed') {
      await dbw
        .update(s.transactions)
        .set({
          state: 'failed',
          failureCode:
            'provider_reconciliation',
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
        ledgerCents,
        amountCents:
          row.amountCents,
      });

      await recordAudit({
        action:
          'reconciliation.escalated',
        entity: 'transaction',
        entityId:
          row.transactionId,
        after: {
          localState: row.state,
          providerState,
          ledgerCents,
          amountCents:
            row.amountCents,
          decision: action,
        },
      });
    }
  }

  return report;
}
