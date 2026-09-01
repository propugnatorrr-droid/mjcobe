import 'server-only';

import type {
  ProviderId,
} from '@/lib/payments/types';
import {
  stripeClient,
} from '@/lib/payments/stripe';

export type ProviderPaymentState =
  | 'succeeded'
  | 'captured'
  | 'processing'
  | 'requires_capture'
  | 'requires_confirmation'
  | 'requires_payment_method'
  | 'requires_action'
  | 'canceled'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'initiated'
  | 'authorized'
  | null;

type ReadProviderStateInput = {
  provider: ProviderId;
  providerRef: string | null;
  localState: string;
};

/**
 * Reads payment state without changing money.
 *
 * Stripe is queried directly. Mock and offline payments do not have a
 * durable external API, so their already-persisted local state is returned.
 */
export async function readProviderState(
  input: ReadProviderStateInput,
): Promise<ProviderPaymentState> {
  if (input.provider !== 'stripe') {
    switch (input.localState) {
      case 'settled':
        return 'succeeded';
      case 'captured':
        return 'captured';
      case 'refunded':
        return 'refunded';
      case 'partially_refunded':
        return 'partially_refunded';
      case 'failed':
        return 'failed';
      case 'canceled':
        return 'canceled';
      case 'authorized':
        return 'authorized';
      case 'initiated':
        return 'initiated';
      default:
        return null;
    }
  }

  if (!input.providerRef) {
    return null;
  }

  const stripe = stripeClient();

  const intent =
    await stripe.paymentIntents.retrieve(
      input.providerRef,
      {
        expand: ['latest_charge'],
      },
    );

  if (intent.status !== 'succeeded') {
    switch (intent.status) {
      case 'canceled':
        return 'canceled';

      case 'processing':
        return 'processing';

      case 'requires_action':
        return 'requires_action';

      case 'requires_capture':
        return 'requires_capture';

      case 'requires_confirmation':
        return 'requires_confirmation';

      case 'requires_payment_method':
        return 'requires_payment_method';

      default:
        /*
         * Stripe types permit future status
         * strings through OtherString. Unknown
         * provider states must not trigger an
         * automatic financial repair.
         */
        return null;
    }
  }


  const charge =
    typeof intent.latest_charge ===
    'object'
      ? intent.latest_charge
      : null;

  const refundedCents =
    charge?.amount_refunded ?? 0;

  if (
    refundedCents > 0 &&
    refundedCents >= intent.amount_received
  ) {
    return 'refunded';
  }

  if (refundedCents > 0) {
    return 'partially_refunded';
  }

  return 'succeeded';
}
