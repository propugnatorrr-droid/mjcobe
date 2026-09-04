import 'server-only';
import { randomBytes, createHash } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { getProvider, type ProviderId } from '@/lib/payments';
import { attachReservationToOrder } from '@/lib/commerce/reservations';
import { orderConfirmationToken, verifyOrderConfirmationToken } from '@/lib/commerce/order-credentials';
import { issueTicketsForOrder } from '@/lib/tickets/issue';
import { sendTicketOrderConfirmation } from '@/lib/tickets/notify';

const sha = (v: string) => createHash('sha256').update(v).digest('hex');

export type CommerceOrderType = 'ticket' | 'shop';

export type CreateOrderItemInput = {
  itemType: 'ticket_type' | 'product_variant';
  referenceId: string;
  titleSnapshot: string;
  unitPriceCents: number;
  quantity: number;
};

export type CreateOrderInput = {
  orderType: CommerceOrderType;
  buyerEmail: string;
  items: CreateOrderItemInput[];
  /** Reservations already taken (lib/commerce/reservations.ts) for the
   * items above — attached to the order inside the same transaction that
   * creates it. Order creation itself never takes a reservation; that
   * must have already happened before this is called. */
  reservationIds: string[];
  idempotencyKey: string;
  providerId?: ProviderId;
  simulateCard?: string;
  description?: string;
};

export type CreateOrderResult = {
  orderId: string;
  secureToken: string;
  paymentId: string;
  intentId: string;
  clientSecret?: string;
};

function generateOrderNumber(): string {
  // Human-readable only — never used for authorization (secureToken is).
  // Timestamp + random suffix avoids needing a dedicated sequence table;
  // collisions are astronomically unlikely and orderNumber has no unique
  // constraint tightness requirement beyond "looks sequential to a human".
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = randomBytes(2).toString('hex').toUpperCase();
  return `MJC-${stamp}-${suffix}`;
}

/**
 * Idempotent commerce order creation — mirrors lib/ledger/contributions.ts's
 * createContribution() shape exactly (client-supplied idempotency key →
 * payload-hash-scoped check against the SAME idempotency_keys table, new
 * `create_commerce_order:` scope prefix per the architecture plan →
 * advisory-lock-guarded transaction → provider intent → local rows →
 * store idempotency result), but writes ONLY to commerce_orders/
 * commerce_order_items/commerce_payments — never to contributions/
 * transactions/ledger_entries. That table boundary is the one invariant
 * this whole initiative cannot violate.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (input.items.length === 0) {
    throw new Error('An order must have at least one item.');
  }
  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('Item quantity must be a positive integer.');
    }
    if (!Number.isInteger(item.unitPriceCents) || item.unitPriceCents <= 0) {
      throw new Error('Item unit price must be a positive integer.');
    }
  }

  const subtotalCents = input.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const totalCents = subtotalCents; // no tax/shipping yet — shop checkout (Batch J) adds those inputs

  const provider = getProvider(input.providerId);
  const key = input.idempotencyKey;

  // Binds the attempt key to the immutable payment details, exactly like
  // createContribution's payloadHash — a caller may safely retry the same
  // request, but may not reuse the key for different items/amount/buyer.
  const payloadHash = sha(
    JSON.stringify({
      orderType: input.orderType,
      buyerEmailHash: sha(input.buyerEmail.trim().toLowerCase()),
      items: input.items.map((i) => ({ itemType: i.itemType, referenceId: i.referenceId, unitPriceCents: i.unitPriceCents, quantity: i.quantity })),
      totalCents,
      providerId: provider.id,
    }),
  );
  const scope = `create_commerce_order:${payloadHash}`;

  return dbw.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`);

    const [existing] = await tx.select().from(s.idempotencyKeys).where(eq(s.idempotencyKeys.key, key)).limit(1);

    if (existing) {
      if (existing.scope !== scope) {
        throw new Error('Checkout attempt key was reused with different order details.');
      }
      if (!existing.result) {
        throw new Error('Checkout attempt has no stored result.');
      }
      return existing.result as unknown as CreateOrderResult;
    }

    const intent = await provider.createIntent({
      amountCents: totalCents,
      currency: 'USD',
      simulateCard: input.simulateCard,
      customerEmail: input.buyerEmail,
      description: input.description,
      idempotencyKey: key,
      metadata: { entity_type: 'commerce_order', order_type: input.orderType },
    });

    const orderNumber = generateOrderNumber();

    const [order] = await tx
      .insert(s.commerceOrders)
      .values({
        orderType: input.orderType,
        orderNumber,
        buyerEmail: input.buyerEmail,
        status: 'pending',
        subtotalCents,
        totalCents,
      })
      .returning({ id: s.commerceOrders.id, credentialVersion: s.commerceOrders.credentialVersion });

    if (!order) {
      throw new Error('Order was not created.');
    }

    const secureToken = orderConfirmationToken(order.id, order.credentialVersion);

    await tx.insert(s.commerceOrderItems).values(
      input.items.map((item) => ({
        orderId: order.id,
        itemType: item.itemType,
        referenceId: item.referenceId,
        titleSnapshot: item.titleSnapshot,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
        lineTotalCents: item.unitPriceCents * item.quantity,
      })),
    );

    const [payment] = await tx
      .insert(s.commercePayments)
      .values({
        orderId: order.id,
        provider: provider.id,
        providerRef: intent.intentId,
        state: 'initiated',
        amountCents: totalCents,
      })
      .returning({ id: s.commercePayments.id });

    if (!payment) {
      throw new Error('Payment was not created.');
    }

    for (const reservationId of input.reservationIds) {
      await attachReservationToOrder(tx, reservationId, order.id);
    }

    const result: CreateOrderResult = {
      orderId: order.id,
      secureToken,
      paymentId: payment.id,
      intentId: intent.intentId,
      clientSecret: intent.clientSecret,
    };

    await tx.insert(s.idempotencyKeys).values({ key, scope, result });

    return result;
  });
}

export type SettleOrderResult = { ok: true } | { ok: false; code: string; message: string };

/**
 * Mirrors settleContribution()'s idempotent-early-return + advisory-lock
 * shape, simplified: commerce checkout always uses automatic capture (no
 * sponsorship-style manual-review authorize/capture split), so there's no
 * two-phase dance to replicate. Amount is re-validated against the DB
 * row's own amountCents, never trusted from a webhook payload.
 */
export async function settleOrder(paymentId: string): Promise<SettleOrderResult> {
  const [payment] = await dbw.select().from(s.commercePayments).where(eq(s.commercePayments.id, paymentId)).limit(1);
  if (!payment) return { ok: false, code: 'not_found', message: 'Payment not found.' };

  if (payment.state === 'settled') {
    return { ok: true };
  }

  const provider = getProvider(payment.provider);
  const outcome = await provider.capture(payment.providerRef ?? '');

  if (outcome.status === 'failed') {
    await dbw.update(s.commercePayments).set({ state: 'failed', updatedAt: new Date() }).where(eq(s.commercePayments.id, paymentId));
    await dbw.update(s.commerceOrders).set({ status: 'failed', updatedAt: new Date() }).where(eq(s.commerceOrders.id, payment.orderId));
    return { ok: false, code: outcome.code, message: outcome.message };
  }

  if (outcome.status === 'pending') {
    await dbw.update(s.commercePayments).set({ state: 'authorized', updatedAt: new Date() }).where(eq(s.commercePayments.id, paymentId));
    return { ok: false, code: 'pending', message: 'Payment is still processing.' };
  }

  const result = await dbw.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${paymentId}, 0))`);

    const [current] = await tx.select().from(s.commercePayments).where(eq(s.commercePayments.id, paymentId)).limit(1);
    if (!current) return { ok: false as const, code: 'not_found', message: 'Payment not found.', orderType: null };
    if (current.state === 'settled') return { ok: true as const, orderType: null };

    const now = new Date();

    await tx
      .update(s.commercePayments)
      .set({ state: 'settled', settledAt: now, updatedAt: now })
      .where(eq(s.commercePayments.id, paymentId));

    const [order] = await tx
      .select({ id: s.commerceOrders.id, orderType: s.commerceOrders.orderType })
      .from(s.commerceOrders)
      .where(eq(s.commerceOrders.id, current.orderId))
      .limit(1);

    await tx.update(s.commerceOrders).set({ status: 'paid', updatedAt: now }).where(eq(s.commerceOrders.id, current.orderId));

    // Ticket issuance happens inside this same transaction, per the plan
    // — a reader can never see a paid ticket order with no tickets, or
    // vice versa. Idempotent by construction (see issueTicketsForOrder's
    // own doc comment), so this is safe even on a webhook retry that
    // somehow reached this far (it won't: the settled-state early-return
    // above already prevents that in the normal case).
    if (order?.orderType === 'ticket') {
      await issueTicketsForOrder(tx, current.orderId);
    }

    // The reservation's job is done — the order's own items are now the
    // durable capacity record (see lib/commerce/reservations.ts's
    // `committed` query). Deleting it here, inside the same transaction
    // that flips the order to 'paid', is what keeps those two facts
    // atomic: a reader can never see "reservation gone, order not yet paid".
    await tx.delete(s.inventoryReservations).where(eq(s.inventoryReservations.orderId, current.orderId));

    return { ok: true as const, orderType: order?.orderType ?? null, orderId: current.orderId };
  });

  // Email is sent outside the settled transaction, same discipline as
  // sendContributionConfirmation() — an email-provider outage must never
  // roll back or misreport a successful payment. Failures are swallowed;
  // the buyer's own confirmation page (/orders/[secureToken]) is always
  // available regardless of email delivery state.
  if (result.ok && result.orderType === 'ticket' && 'orderId' in result) {
    await sendTicketOrderConfirmation(result.orderId).catch((error) => {
      console.error('[ticket-confirmation-email-failed]', { orderId: result.orderId, error });
    });
  }

  return result.ok ? { ok: true } : { ok: false, code: result.code, message: result.message };
}

/** Payment failed/canceled before settlement — releases the reservation
 * immediately rather than waiting for it to expire naturally. */
export async function releaseOrderReservations(orderId: string): Promise<void> {
  await dbw.delete(s.inventoryReservations).where(eq(s.inventoryReservations.orderId, orderId));
}

export async function getOrderBySecureToken(secureToken: string) {
  const verified = verifyOrderConfirmationToken(secureToken);
  if (!verified) return null;

  const [order] = await db.select().from(s.commerceOrders).where(eq(s.commerceOrders.id, verified.orderId)).limit(1);
  if (!order) return null;

  // A credential signed under a since-superseded version (see
  // regenerateOrderCredential below) verifies its HMAC fine — the secret
  // hasn't changed — but must still be rejected: version is part of what
  // was signed, and the row no longer matches it.
  if (order.credentialVersion !== verified.credentialVersion) return null;

  const items = await db.select().from(s.commerceOrderItems).where(eq(s.commerceOrderItems.orderId, order.id));

  return { order, items };
}

/** Invalidates every previously issued confirmation link for this order
 * by bumping its credential version, and returns the new one — used by
 * an admin "resend/regenerate" action. No DB row beyond the counter
 * itself needs to change; nothing was ever storing the old token to clean up. */
export async function regenerateOrderCredential(orderId: string): Promise<string | null> {
  const [updated] = await dbw
    .update(s.commerceOrders)
    .set({ credentialVersion: sql`${s.commerceOrders.credentialVersion} + 1`, updatedAt: new Date() })
    .where(eq(s.commerceOrders.id, orderId))
    .returning({ id: s.commerceOrders.id, credentialVersion: s.commerceOrders.credentialVersion });

  if (!updated) return null;

  return orderConfirmationToken(updated.id, updated.credentialVersion);
}

export async function getOrderByPaymentProviderRef(providerRef: string) {
  const [payment] = await db.select().from(s.commercePayments).where(eq(s.commercePayments.providerRef, providerRef)).limit(1);
  return payment ?? null;
}

export type RefundOrderResult = { ok: true; refundId: string } | { ok: false; code: string; message: string };

/**
 * Admin-initiated refund. Money only — never touches tickets. Per this
 * initiative's explicit correction, a partial refund on a ticket order
 * must NOT auto-void any ticket (ambiguous which attendee loses
 * admission); voiding specific tickets is a separate, deliberate admin
 * action against the `tickets` table once Batch H exists. This function's
 * only job is recomputing `commerce_orders.status` from net paid-minus-
 * refunded — 'refunded' once the full amount is back, 'partially_refunded'
 * otherwise.
 */
export async function refundOrder(input: {
  paymentId: string;
  amountCents: number;
  reason: string;
}): Promise<RefundOrderResult> {
  const [payment] = await dbw.select().from(s.commercePayments).where(eq(s.commercePayments.id, input.paymentId)).limit(1);
  if (!payment) return { ok: false, code: 'not_found', message: 'Payment not found.' };
  if (payment.state !== 'settled') return { ok: false, code: 'not_settled', message: 'Payment has not settled.' };

  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    return { ok: false, code: 'invalid_amount', message: 'Refund amount must be a positive integer.' };
  }

  const [created] = await dbw
    .insert(s.commerceRefunds)
    .values({ paymentId: input.paymentId, amountCents: input.amountCents, reason: input.reason, status: 'creating' })
    .returning({ id: s.commerceRefunds.id });

  if (!created) return { ok: false, code: 'failed', message: 'Refund record was not created.' };

  const provider = getProvider(payment.provider);
  const outcome = await provider.refund(payment.providerRef ?? '', input.amountCents, 'other', created.id);

  if (outcome.status === 'failed') {
    await dbw.update(s.commerceRefunds).set({ status: 'failed', updatedAt: new Date() }).where(eq(s.commerceRefunds.id, created.id));
    return { ok: false, code: outcome.code, message: outcome.message };
  }

  await dbw
    .update(s.commerceRefunds)
    .set({ providerRef: outcome.providerRef, status: outcome.status === 'succeeded' ? 'succeeded' : 'pending', updatedAt: new Date() })
    .where(eq(s.commerceRefunds.id, created.id));

  await recomputeOrderRefundStatus(payment.orderId, payment.amountCents);

  return { ok: true, refundId: created.id };
}

async function recomputeOrderRefundStatus(orderId: string, paidAmountCents: number): Promise<void> {
  const [payment] = await dbw.select({ id: s.commercePayments.id }).from(s.commercePayments).where(eq(s.commercePayments.orderId, orderId)).limit(1);
  if (!payment) return;

  const [refundedRow] = await dbw
    .select({ total: sql<number>`coalesce(sum(${s.commerceRefunds.amountCents}), 0)` })
    .from(s.commerceRefunds)
    .where(eq(s.commerceRefunds.paymentId, payment.id));

  const refundedCents = Number(refundedRow?.total ?? 0);
  const status = refundedCents >= paidAmountCents ? 'refunded' : refundedCents > 0 ? 'partially_refunded' : 'paid';

  await dbw.update(s.commerceOrders).set({ status, updatedAt: new Date() }).where(eq(s.commerceOrders.id, orderId));
}

/**
 * Minimal dispute handling: flips the order to a 'disputed' status so an
 * admin sees it, without attempting to fully model Stripe's dispute
 * lifecycle (won/lost/needs_response/warning states, funds-withdrawn vs
 * funds-reinstated timing). Building that out with the same rigor as
 * lib/ledger/contributions.ts's reconcileDispute() is a reasonable future
 * addition once commerce orders actually see real dispute volume — this
 * is deliberately the narrower, honest version for this batch rather than
 * a guess at behavior nothing has verified yet.
 */
export async function flagCommerceOrderDisputed(input: {
  providerRef: string;
  movement: 'none' | 'withdrawn' | 'reinstated';
}): Promise<{ ok: boolean; message?: string }> {
  const [payment] = await dbw.select().from(s.commercePayments).where(eq(s.commercePayments.providerRef, input.providerRef)).limit(1);
  if (!payment) return { ok: false, message: `No commerce payment matches PaymentIntent ${input.providerRef}.` };

  const status = input.movement === 'reinstated' ? 'paid' : 'disputed';

  await dbw.update(s.commerceOrders).set({ status, updatedAt: new Date() }).where(eq(s.commerceOrders.id, payment.orderId));

  console.error('[commerce-order-disputed]', { orderId: payment.orderId, movement: input.movement });

  return { ok: true };
}

/**
 * Webhook-driven refund confirmation — looks up the refund by the
 * provider's own reference (already stored by refundOrder's synchronous
 * call) and updates its status, then recomputes the order's refund
 * status. Unlike lib/ledger/contributions.ts's reconcileRefund, this does
 * NOT insert-a-row-if-missing for a refund created directly in the Stripe
 * dashboard rather than through refundOrder — every commerce refund in
 * this batch originates from refundOrder, so an unmatched providerRef is
 * logged and skipped rather than guessed at. Extending this to handle
 * dashboard-originated refunds is a reasonable future addition once that
 * becomes a real operational need, not something assumed safe to guess at now.
 */
export async function reconcileOrderRefund(input: {
  providerRef: string;
  status: string;
}): Promise<{ ok: boolean; message?: string }> {
  const [refund] = await dbw.select().from(s.commerceRefunds).where(eq(s.commerceRefunds.providerRef, input.providerRef)).limit(1);

  if (!refund) {
    console.error('[commerce-refund-unmatched]', { providerRef: input.providerRef });
    return { ok: true };
  }

  await dbw
    .update(s.commerceRefunds)
    .set({ status: input.status === 'succeeded' ? 'succeeded' : input.status, updatedAt: new Date() })
    .where(eq(s.commerceRefunds.id, refund.id));

  const [payment] = await dbw.select().from(s.commercePayments).where(eq(s.commercePayments.id, refund.paymentId)).limit(1);
  if (payment) {
    await recomputeOrderRefundStatus(payment.orderId, payment.amountCents);
  }

  return { ok: true };
}
