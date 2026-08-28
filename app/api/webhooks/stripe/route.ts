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
  stripeClient,
} from '@/lib/payments/stripe';

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

async function transactionFor(
  providerRef: string,
) {
  const [transaction] =
    await db
      .select({
        id:
          s.transactions.id,
        state:
          s.transactions.state,
      })
      .from(s.transactions)
      .where(
        and(
          eq(
            s.transactions.provider,
            'stripe',
          ),
          eq(
            s.transactions.providerRef,
            providerRef,
          ),
        ),
      )
      .limit(1);

  return transaction ?? null;
}

async function requireTransaction(
  providerRef: string,
) {
  const transaction =
    await transactionFor(
      providerRef,
    );

  if (!transaction) {
    throw new Error(
      `No transaction exists for Stripe PaymentIntent ${providerRef}.`,
    );
  }

  return transaction;
}

async function handleSucceeded(
  intent:
    Stripe.PaymentIntent,
): Promise<void> {
  const transaction =
    await requireTransaction(
      intent.id,
    );

  const settled =
    await settleContribution(
      transaction.id,
    );

  if (!settled.ok) {
    throw new Error(
      `Could not settle ${transaction.id}: ${settled.code}`,
    );
  }
}

async function handleCapturable(
  intent:
    Stripe.PaymentIntent,
): Promise<void> {
  const transaction =
    await requireTransaction(
      intent.id,
    );

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
          transaction.id,
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

async function handleProcessing(
  intent:
    Stripe.PaymentIntent,
): Promise<void> {
  const transaction =
    await requireTransaction(
      intent.id,
    );

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
          transaction.id,
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

async function handleFailed(
  intent:
    Stripe.PaymentIntent,
): Promise<void> {
  const transaction =
    await requireTransaction(
      intent.id,
    );

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
          transaction.id,
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

async function handleCanceled(
  intent:
    Stripe.PaymentIntent,
): Promise<void> {
  const transaction =
    await requireTransaction(
      intent.id,
    );

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
          transaction.id,
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
