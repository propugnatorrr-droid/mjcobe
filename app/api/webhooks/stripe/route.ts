import {
  NextResponse,
} from 'next/server';
import type Stripe from 'stripe';
import {
  and,
  eq,
  inArray,
} from 'drizzle-orm';
import {
  dbw,
} from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import {
  reconcileDispute,
  reconcileRefund,
  settleContribution,
} from '@/lib/ledger/contributions';
import {
  stripeClient,
} from '@/lib/payments/stripe';
import {
  resolvePaymentDomain,
} from '@/lib/payments/webhook-resolver';
import {
  settleOrder,
  reconcileOrderRefund,
  flagCommerceOrderDisputed,
} from '@/lib/commerce/orders';

export const runtime =
  'nodejs';

export const dynamic =
  'force-dynamic';

function webhookSecret():
string {
  const value =
    process.env
      .STRIPE_WEBHOOK_SECRET;

  if (
    !value ||
    !value.startsWith(
      'whsec_',
    )
  ) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET is not set or is invalid.',
    );
  }

  return value;
}

async function handleContributionSucceeded(
  transactionId: string,
): Promise<void> {
  const settled =
    await settleContribution(
      transactionId,
    );

  if (!settled.ok) {
    throw new Error(
      `Could not settle ${transactionId}: ${settled.code}`,
    );
  }
}

async function handleContributionCapturable(
  intent: Stripe.PaymentIntent,
  transactionId: string,
): Promise<void> {
  if (
    intent.status !==
    'requires_capture'
  ) {
    return;
  }

  const now = new Date();

  await dbw
    .update(s.transactions)
    .set({
      state: 'authorized',
      authorizedAt: now,
      failureCode: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(
          s.transactions.id,
          transactionId,
        ),
        inArray(
          s.transactions.state,
          [
            'initiated',
            'failed',
          ],
        ),
      ),
    );
}

async function handleContributionProcessing(
  transactionId: string,
): Promise<void> {
  const now = new Date();

  await dbw
    .update(s.transactions)
    .set({
      state: 'authorized',
      authorizedAt: now,
      failureCode: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(
          s.transactions.id,
          transactionId,
        ),
        inArray(
          s.transactions.state,
          [
            'initiated',
            'failed',
          ],
        ),
      ),
    );
}

async function handleContributionFailed(
  intent: Stripe.PaymentIntent,
  transactionId: string,
): Promise<void> {
  const now = new Date();

  await dbw
    .update(s.transactions)
    .set({
      state: 'failed',
      failureCode:
        intent
          .last_payment_error
          ?.code ??
        'payment_failed',
      updatedAt: now,
    })
    .where(
      and(
        eq(
          s.transactions.id,
          transactionId,
        ),
        inArray(
          s.transactions.state,
          [
            'initiated',
            'authorized',
            'failed',
          ],
        ),
      ),
    );
}

async function handleContributionCanceled(
  intent: Stripe.PaymentIntent,
  transactionId: string,
): Promise<void> {
  const now = new Date();

  await dbw
    .update(s.transactions)
    .set({
      state: 'canceled',
      failureCode:
        intent
          .cancellation_reason ??
        'payment_canceled',
      updatedAt: now,
    })
    .where(
      and(
        eq(
          s.transactions.id,
          transactionId,
        ),
        inArray(
          s.transactions.state,
          [
            'initiated',
            'authorized',
            'failed',
            'canceled',
          ],
        ),
      ),
    );
}

// -------------------------------------------------------- commerce orders ----

async function handleCommerceOrderSucceeded(
  paymentId: string,
): Promise<void> {
  const settled = await settleOrder(paymentId);

  if (!settled.ok) {
    throw new Error(
      `Could not settle commerce payment ${paymentId}: ${settled.code}`,
    );
  }
}

async function handleCommerceOrderCapturable(
  intent: Stripe.PaymentIntent,
  paymentId: string,
): Promise<void> {
  if (intent.status !== 'requires_capture') return;

  await dbw
    .update(s.commercePayments)
    .set({ state: 'authorized', updatedAt: new Date() })
    .where(and(eq(s.commercePayments.id, paymentId), inArray(s.commercePayments.state, ['initiated', 'failed'])));
}

async function handleCommerceOrderProcessing(
  paymentId: string,
): Promise<void> {
  await dbw
    .update(s.commercePayments)
    .set({ state: 'authorized', updatedAt: new Date() })
    .where(and(eq(s.commercePayments.id, paymentId), inArray(s.commercePayments.state, ['initiated', 'failed'])));
}

async function handleCommerceOrderFailed(
  paymentId: string,
  orderId: string,
): Promise<void> {
  const now = new Date();

  await dbw
    .update(s.commercePayments)
    .set({ state: 'failed', updatedAt: now })
    .where(and(eq(s.commercePayments.id, paymentId), inArray(s.commercePayments.state, ['initiated', 'authorized', 'failed'])));

  await dbw
    .update(s.commerceOrders)
    .set({ status: 'failed', updatedAt: now })
    .where(eq(s.commerceOrders.id, orderId));

  // Payment failed — free the held capacity immediately rather than
  // waiting for the reservation's own TTL to expire, so the next buyer
  // isn't blocked by a hold that's already known to be dead.
  await dbw.delete(s.inventoryReservations).where(eq(s.inventoryReservations.orderId, orderId));
}

async function handleCommerceOrderCanceled(
  paymentId: string,
  orderId: string,
): Promise<void> {
  const now = new Date();

  await dbw
    .update(s.commercePayments)
    .set({ state: 'canceled', updatedAt: now })
    .where(
      and(
        eq(s.commercePayments.id, paymentId),
        inArray(s.commercePayments.state, ['initiated', 'authorized', 'failed', 'canceled']),
      ),
    );

  await dbw
    .update(s.commerceOrders)
    .set({ status: 'canceled', updatedAt: now })
    .where(eq(s.commerceOrders.id, orderId));

  await dbw.delete(s.inventoryReservations).where(eq(s.inventoryReservations.orderId, orderId));
}

// -------------------------------------------------------------- dispatch ----

/**
 * The correction on top of the original plan: resolve which domain owns
 * this PaymentIntent BEFORE any handler runs, rather than assuming every
 * `payment_intent.*` event is a contribution (the original design) or
 * trusting `intent.metadata.entity_type` alone. `requireTransaction()` is
 * never called before this resolution.
 */
async function handleSucceeded(intent: Stripe.PaymentIntent): Promise<void> {
  const owner = await resolvePaymentDomain(intent.id);
  if (owner.domain === 'contribution') return handleContributionSucceeded(owner.transactionId);
  if (owner.domain === 'commerce') return handleCommerceOrderSucceeded(owner.paymentId);
  throw new Error(`No transaction or commerce payment exists for Stripe PaymentIntent ${intent.id}.`);
}

async function handleCapturable(intent: Stripe.PaymentIntent): Promise<void> {
  const owner = await resolvePaymentDomain(intent.id);
  if (owner.domain === 'contribution') return handleContributionCapturable(intent, owner.transactionId);
  if (owner.domain === 'commerce') return handleCommerceOrderCapturable(intent, owner.paymentId);
  throw new Error(`No transaction or commerce payment exists for Stripe PaymentIntent ${intent.id}.`);
}

async function handleProcessing(intent: Stripe.PaymentIntent): Promise<void> {
  const owner = await resolvePaymentDomain(intent.id);
  if (owner.domain === 'contribution') return handleContributionProcessing(owner.transactionId);
  if (owner.domain === 'commerce') return handleCommerceOrderProcessing(owner.paymentId);
  throw new Error(`No transaction or commerce payment exists for Stripe PaymentIntent ${intent.id}.`);
}

async function handleFailed(intent: Stripe.PaymentIntent): Promise<void> {
  const owner = await resolvePaymentDomain(intent.id);
  if (owner.domain === 'contribution') return handleContributionFailed(intent, owner.transactionId);
  if (owner.domain === 'commerce') return handleCommerceOrderFailed(owner.paymentId, owner.orderId);
  throw new Error(`No transaction or commerce payment exists for Stripe PaymentIntent ${intent.id}.`);
}

async function handleCanceled(intent: Stripe.PaymentIntent): Promise<void> {
  const owner = await resolvePaymentDomain(intent.id);
  if (owner.domain === 'contribution') return handleContributionCanceled(intent, owner.transactionId);
  if (owner.domain === 'commerce') return handleCommerceOrderCanceled(owner.paymentId, owner.orderId);
  throw new Error(`No transaction or commerce payment exists for Stripe PaymentIntent ${intent.id}.`);
}

function refundPaymentIntentId(
  refund: Stripe.Refund,
): string | null {
  const paymentIntent =
    refund.payment_intent;

  if (
    typeof paymentIntent ===
    'string'
  ) {
    return paymentIntent;
  }

  return paymentIntent?.id ?? null;
}

async function handleRefund(
  refund: Stripe.Refund,
): Promise<void> {
  const paymentIntentId =
    refundPaymentIntentId(refund);

  // Same domain-resolution discipline as the payment_intent.* handlers
  // above: check which table actually owns this reference before
  // deciding where the refund belongs. Unlike those handlers, an
  // unresolvable/'none' PaymentIntent falls through to the existing
  // contribution path unchanged (it already hard-fails on no match) —
  // that preserves this route's exact prior behavior for every refund
  // that isn't a commerce order.
  const owner = paymentIntentId
    ? await resolvePaymentDomain(paymentIntentId)
    : { domain: 'none' as const };

  if (owner.domain === 'commerce') {
    const reconciled = await reconcileOrderRefund({
      providerRef: refund.id,
      status: refund.status ?? 'pending',
    });

    if (!reconciled.ok) {
      throw new Error(
        reconciled.message ??
        `Could not reconcile commerce refund ${refund.id}.`,
      );
    }

    return;
  }

  const reconciled =
    await reconcileRefund({
      providerRef:
        refund.id,
      localRefundId:
        refund.metadata
          ?.mj_cobe_refund_id ??
        null,
      paymentIntentId,
      amountCents:
        refund.amount,
      status:
        refund.status ??
        'pending',
      failureReason:
        refund.failure_reason ??
        null,
      reason:
        refund.metadata
          ?.mj_cobe_refund_reason,
    });

  if (!reconciled.ok) {
    throw new Error(
      reconciled.message ??
      `Could not reconcile refund ${refund.id}.`,
    );
  }
}

function disputePaymentIntentId(
  dispute: Stripe.Dispute,
): string | null {
  const paymentIntent =
    dispute.payment_intent;

  if (
    typeof paymentIntent ===
    'string'
  ) {
    return paymentIntent;
  }

  return paymentIntent?.id ?? null;
}

async function handleDispute(
  dispute: Stripe.Dispute,
  movement:
    | 'none'
    | 'withdrawn'
    | 'reinstated',
): Promise<void> {
  const paymentIntentId =
    disputePaymentIntentId(
      dispute,
    );

  if (!paymentIntentId) {
    throw new Error(
      `Stripe dispute ${dispute.id} has no PaymentIntent.`,
    );
  }

  const owner = await resolvePaymentDomain(paymentIntentId);

  if (owner.domain === 'commerce') {
    const flagged = await flagCommerceOrderDisputed({
      providerRef: paymentIntentId,
      movement,
    });

    if (!flagged.ok) {
      throw new Error(
        flagged.message ??
        `Could not flag commerce dispute ${dispute.id}.`,
      );
    }

    return;
  }

  const reconciled =
    await reconcileDispute({
      providerRef:
        dispute.id,
      paymentIntentId,
      amountCents:
        dispute.amount,
      state:
        dispute.status,
      movement,
    });

  if (!reconciled.ok) {
    throw new Error(
      reconciled.message ??
      `Could not reconcile dispute ${dispute.id}.`,
    );
  }
}

async function processEvent(
  event: Stripe.Event,
): Promise<void> {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handleSucceeded(
        event.data.object,
      );
      return;

    case 'payment_intent.amount_capturable_updated':
      await handleCapturable(
        event.data.object,
      );
      return;

    case 'payment_intent.processing':
      await handleProcessing(
        event.data.object,
      );
      return;

    case 'payment_intent.payment_failed':
      await handleFailed(
        event.data.object,
      );
      return;

    case 'payment_intent.canceled':
      await handleCanceled(
        event.data.object,
      );
      return;

    case 'refund.created':
    case 'refund.updated':
    case 'refund.failed':
      await handleRefund(
        event.data.object,
      );
      return;

    case 'charge.dispute.created':
    case 'charge.dispute.updated':
    case 'charge.dispute.closed':
      await handleDispute(
        event.data.object,
        'none',
      );
      return;

    case 'charge.dispute.funds_withdrawn':
      await handleDispute(
        event.data.object,
        'withdrawn',
      );
      return;

    case 'charge.dispute.funds_reinstated':
      await handleDispute(
        event.data.object,
        'reinstated',
      );
      return;

    default:
      return;
  }
}

export async function POST(
  request: Request,
) {
  const signature =
    request.headers.get(
      'stripe-signature',
    );

  if (!signature) {
    return NextResponse.json(
      {
        error:
          'Missing Stripe signature.',
      },
      {
        status: 400,
      },
    );
  }

  const rawBody =
    await request.text();

  let event:
    Stripe.Event;

  try {
    event = stripeClient()
      .webhooks
      .constructEvent(
        rawBody,
        signature,
        webhookSecret(),
      );
  } catch (error) {
    console.error(
      'Stripe webhook signature verification failed.',
      error,
    );

    return NextResponse.json(
      {
        error:
          'Invalid Stripe signature.',
      },
      {
        status: 400,
      },
    );
  }

  let payload:
    Record<string, unknown>;

  try {
    payload = JSON.parse(
      rawBody,
    ) as Record<
      string,
      unknown
    >;
  } catch {
    return NextResponse.json(
      {
        error:
          'Invalid webhook payload.',
      },
      {
        status: 400,
      },
    );
  }

  const [claimed] =
    await dbw
      .insert(
        s.webhookEvents,
      )
      .values({
        id: event.id,
        provider: 'stripe',
        type: event.type,
        payload,
      })
      .onConflictDoNothing()
      .returning({
        id:
          s.webhookEvents.id,
      });

  if (!claimed) {
    return NextResponse.json({
      received: true,
      duplicate: true,
    });
  }

  try {
    await processEvent(
      event,
    );

    await dbw
      .update(
        s.webhookEvents,
      )
      .set({
        processedAt:
          new Date(),
      })
      .where(
        eq(
          s.webhookEvents.id,
          event.id,
        ),
      );
  } catch (error) {
    /*
     * Remove the claim when processing fails.
     * Stripe can then retry the event instead
     * of the unprocessed claim permanently
     * suppressing every retry.
     */
    await dbw
      .delete(
        s.webhookEvents,
      )
      .where(
        eq(
          s.webhookEvents.id,
          event.id,
        ),
      );

    console.error(
      `Stripe webhook ${event.id} failed.`,
      error,
    );

    return NextResponse.json(
      {
        error:
          'Webhook processing failed.',
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    received: true,
  });
}
