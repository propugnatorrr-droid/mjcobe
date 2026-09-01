/**
 * Pure reconciliation rules.
 *
 * The provider is the authority on whether money moved; the ledger is the
 * authority on what we display. When they disagree, exactly one of them is
 * stale, and this decides which.
 */

export type ReconcileAction =
  | 'settle'
  | 'refund_ledger'
  | 'mark_failed'
  | 'escalate'
  | 'none';

export type ReconcileInput = {
  /** Our stored transaction state. */
  localState: string;
  /** Provider's current state, or null when unreachable. */
  providerState: string | null;
  /** Net ledger balance for this contribution. */
  ledgerCents: number;
  /** Amount the transaction claims. */
  amountCents: number;
  /** Age of the transaction in hours. */
  ageHours: number;
};

const AUTHORIZATION_EXPIRY_HOURS = 144;

export function reconcileAction(
  input: ReconcileInput,
): ReconcileAction {
  /*
   * Provider unreachable: never act on silence.
   * A stale read must not move money or numbers.
   */
  if (input.providerState === null) {
    return 'none';
  }

  const providerHasMoney =
    input.providerState === 'succeeded' ||
    input.providerState === 'settled' ||
    input.providerState === 'captured';

  const providerRefunded =
    input.providerState === 'refunded';

  const providerFailed =
    input.providerState === 'failed' ||
    input.providerState === 'canceled';

  /*
   * Money moved but we never wrote a ledger
   * entry — the webhook was lost. This is the
   * common real failure.
   */
  if (
    providerHasMoney &&
    input.ledgerCents === 0
  ) {
    return 'settle';
  }

  /* Refunded upstream, still counted here. */
  if (
    providerRefunded &&
    input.ledgerCents > 0
  ) {
    return 'refund_ledger';
  }

  /* Failed upstream, nothing counted here. */
  if (
    providerFailed &&
    input.ledgerCents === 0 &&
    input.localState !== 'failed' &&
    input.localState !== 'canceled'
  ) {
    return 'mark_failed';
  }

  /*
   * We are counting money the provider does not
   * report. Never silently correct this — it is
   * either a bug or a partial refund, and both
   * need a human.
   */
  if (
    !providerHasMoney &&
    !providerRefunded &&
    input.ledgerCents > 0
  ) {
    return 'escalate';
  }

  /*
   * An authorization that will expire unclaimed
   * is lost revenue, so surface it before it
   * lapses rather than after.
   */
  if (
    input.localState === 'authorized' &&
    input.ageHours >=
      AUTHORIZATION_EXPIRY_HOURS
  ) {
    return 'escalate';
  }

  /* Amounts disagree: never guess at money. */
  if (
    providerHasMoney &&
    input.ledgerCents !== 0 &&
    input.ledgerCents !==
      input.amountCents
  ) {
    return 'escalate';
  }

  return 'none';
}
