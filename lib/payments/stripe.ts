import 'server-only';

import Stripe from 'stripe';
import type {
  IntentInput,
  IntentResult,
  PaymentProvider,
  ProviderOutcome,
  RefundReasonCode,
} from './types';

let cachedStripe:
  Stripe | null = null;

function secretKey(): string {
  const value =
    process.env
      .STRIPE_SECRET_KEY;

  if (!value) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set.',
    );
  }

  if (
    !value.startsWith(
      'sk_test_',
    ) &&
    !value.startsWith(
      'sk_live_',
    )
  ) {
    throw new Error(
      'STRIPE_SECRET_KEY is not a valid Stripe secret key.',
    );
  }

  return value;
}

export function stripeClient():
Stripe {
  if (cachedStripe) {
    return cachedStripe;
  }

  cachedStripe = new Stripe(
    secretKey(),
    {
      maxNetworkRetries: 2,
      timeout: 20_000,
      appInfo: {
        name: 'MJ COBE',
        version: '0.1.0',
      },
    },
  );

  return cachedStripe;
}

function paymentFailure(
  intent:
    Stripe.PaymentIntent,
): ProviderOutcome {
  return {
    status: 'failed',
    providerRef: intent.id,
    code:
      intent
        .last_payment_error
        ?.code ??
      `payment_intent_${intent.status}`,
    message:
      intent
        .last_payment_error
        ?.message ??
      'The payment could not be completed.',
  };
}

function paymentOutcome(
  intent:
    Stripe.PaymentIntent,
): ProviderOutcome {
  if (
    intent.status ===
    'succeeded'
  ) {
    return {
      status: 'succeeded',
      providerRef: intent.id,
    };
  }

  if (
    intent.status ===
      'processing' ||
    intent.status ===
      'requires_capture'
  ) {
    return {
      status: 'pending',
      providerRef: intent.id,
    };
  }

  return paymentFailure(
    intent,
  );
}

function stripeErrorOutcome(
  error: unknown,
  providerRef: string,
): ProviderOutcome {
  if (
    error instanceof
    Stripe.errors.StripeError
  ) {
    return {
      status: 'failed',
      providerRef,
      code:
        error.code ??
        error.type,
      message:
        error.message,
    };
  }

  return {
    status: 'failed',
    providerRef,
    code: 'stripe_error',
    message:
      'Stripe could not process the request.',
  };
}

function refundMetadata(
  reason:
    RefundReasonCode,
): Record<string, string> {
  return {
    mj_cobe_refund_reason:
      reason,
  };
}

async function createIntent(
  input: IntentInput,
): Promise<IntentResult> {
  if (
    !Number.isInteger(
      input.amountCents,
    ) ||
    input.amountCents <= 0
  ) {
    throw new Error(
      'Stripe amount must be a positive integer.',
    );
  }

  const stripe =
    stripeClient();

  const params:
    Stripe.PaymentIntentCreateParams =
    {
      amount:
        input.amountCents,
      currency:
        input.currency
          .toLowerCase(),
      capture_method:
        input.captureMethod ??
        'automatic',
      automatic_payment_methods:
        {
          enabled: true,
        },
      metadata:
        input.metadata,
    };

  if (
    input.customerEmail
  ) {
    params.receipt_email =
      input.customerEmail;
  }

  if (
    input.description
  ) {
    params.description =
      input.description;
  }

  const options:
    Stripe.RequestOptions = {};

  if (
    input.idempotencyKey
  ) {
    options.idempotencyKey =
      input.idempotencyKey;
  }

  const intent =
    await stripe
      .paymentIntents
      .create(
        params,
        options,
      );

  if (
    !intent.client_secret
  ) {
    throw new Error(
      'Stripe did not return a client secret.',
    );
  }

  return {
    intentId: intent.id,
    clientSecret:
      intent.client_secret,
  };
}

async function captureIntent(
  intentId: string,
): Promise<ProviderOutcome> {
  const stripe =
    stripeClient();

  try {
    const current =
      await stripe
        .paymentIntents
        .retrieve(intentId);

    if (
      current.status ===
      'succeeded'
    ) {
      return {
        status: 'succeeded',
        providerRef:
          current.id,
      };
    }

    if (
      current.status ===
      'processing'
    ) {
      return {
        status: 'pending',
        providerRef:
          current.id,
      };
    }

    if (
      current.status !==
      'requires_capture'
    ) {
      return paymentFailure(
        current,
      );
    }

    const captured =
      await stripe
        .paymentIntents
        .capture(intentId);

    return paymentOutcome(
      captured,
    );
  } catch (error) {
    return stripeErrorOutcome(
      error,
      intentId,
    );
  }
}

async function cancelIntent(
  intentId: string,
): Promise<ProviderOutcome> {
  const stripe =
    stripeClient();

  try {
    const current =
      await stripe
        .paymentIntents
        .retrieve(intentId);

    if (
      current.status ===
      'canceled'
    ) {
      return {
        status: 'succeeded',
        providerRef:
          current.id,
      };
    }

    if (
      current.status ===
      'succeeded'
    ) {
      return {
        status: 'failed',
        providerRef:
          current.id,
        code:
          'already_succeeded',
        message:
          'A completed payment cannot be canceled. Refund it instead.',
      };
    }

    const canceled =
      await stripe
        .paymentIntents
        .cancel(intentId);

    if (
      canceled.status ===
      'canceled'
    ) {
      return {
        status: 'succeeded',
        providerRef:
          canceled.id,
      };
    }

    return paymentOutcome(
      canceled,
    );
  } catch (error) {
    return stripeErrorOutcome(
      error,
      intentId,
    );
  }
}

async function refundIntent(
  intentId: string,
  amountCents: number,
  reason:
    RefundReasonCode,
): Promise<ProviderOutcome> {
  if (
    !Number.isInteger(
      amountCents,
    ) ||
    amountCents <= 0
  ) {
    return {
      status: 'failed',
      providerRef:
        intentId,
      code:
        'invalid_refund_amount',
      message:
        'Refund amount must be a positive integer.',
    };
  }

  const stripe =
    stripeClient();

  try {
    const refund =
      await stripe.refunds
        .create({
          payment_intent:
            intentId,
          amount:
            amountCents,
          metadata:
            refundMetadata(
              reason,
            ),
        });

    if (
      refund.status ===
      'succeeded'
    ) {
      return {
        status: 'succeeded',
        providerRef:
          refund.id,
      };
    }

    if (
      refund.status ===
        'pending' ||
      refund.status ===
        'requires_action'
    ) {
      return {
        status: 'pending',
        providerRef:
          refund.id,
      };
    }

    return {
      status: 'failed',
      providerRef:
        refund.id,
      code:
        refund.failure_reason ??
        `refund_${refund.status}`,
      message:
        'Stripe could not complete the refund.',
    };
  } catch (error) {
    return stripeErrorOutcome(
      error,
      intentId,
    );
  }
}

export const stripeProvider:
PaymentProvider = {
  id: 'stripe',

  get isSimulated() {
    return secretKey()
      .startsWith(
        'sk_test_',
      );
  },

  createIntent,

  capture:
    captureIntent,

  cancel:
    cancelIntent,

  refund:
    refundIntent,
};
