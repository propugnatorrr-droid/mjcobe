export type SponsorPaymentAction =
  | 'capture'
  | 'cancel'
  | 'refund'
  | 'complete'
  | 'wait';

export function sponsorApprovalAction(
  input: {
    transactionState: string;
    contributionModeration:
      string;
  },
): SponsorPaymentAction {
  if (
    input
      .contributionModeration ===
      'blocked' ||
    input
      .contributionModeration ===
      'hidden'
  ) {
    return 'wait';
  }

  if (
    input.transactionState ===
    'authorized'
  ) {
    return 'capture';
  }

  if (
    input.transactionState ===
    'settled'
  ) {
    return 'complete';
  }

  return 'wait';
}

export function sponsorDeclineAction(
  transactionState: string,
): SponsorPaymentAction {
  if (
    transactionState ===
      'settled' ||
    transactionState ===
      'partially_refunded'
  ) {
    return 'refund';
  }

  if (
    transactionState ===
      'initiated' ||
    transactionState ===
      'authorized' ||
    transactionState ===
      'failed'
  ) {
    return 'cancel';
  }

  if (
    transactionState ===
      'canceled' ||
    transactionState ===
      'refunded'
  ) {
    return 'complete';
  }

  /*
   * A captured payment must not be hidden
   * without either settlement or a confirmed
   * refund. Wait for the webhook/reconciliation
   * path instead.
   */
  return 'wait';
}
