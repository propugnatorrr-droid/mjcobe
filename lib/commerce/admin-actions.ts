'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { requireAdminRole } from '@/lib/admin/guard';
import { recordAudit } from '@/lib/audit/log';
import { str, parseAmountCents } from '@/lib/checkout/validate';
import { refundOrder, regenerateOrderCredential } from '@/lib/commerce/orders';
import type { AdminState } from '@/lib/admin/actions';

/** Refunds/order details/fulfillment is finance_admin's domain per the
 * launch role table. */
const ORDER_ROLES = ['finance_admin'] as const;

export async function issueOrderRefund(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...ORDER_ROLES]);

  const orderId = str(formData.get('orderId'), 100);
  const paymentId = str(formData.get('paymentId'), 100);
  const reason = str(formData.get('reason'), 500);
  if (!orderId || !paymentId || !reason) return { error: 'missing' };

  const amountCents = parseAmountCents(formData.get('amount'));
  if (amountCents === null) return { error: 'invalid_amount' };

  const [before] = await db.select().from(s.commerceOrders).where(eq(s.commerceOrders.id, orderId)).limit(1);
  if (!before) return { error: 'not_found' };

  const result = await refundOrder({ paymentId, amountCents, reason });
  if (!result.ok) return { error: result.code };

  await recordAudit({
    adminUserId: me.id,
    action: 'commerce_order.refund',
    entity: 'commerce_order',
    entityId: orderId,
    before: { status: before.status },
    reason,
    after: { amountCents, refundId: result.refundId },
  });

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);

  return { ok: 'saved' };
}

/** Invalidates the order's current confirmation link and issues a new
 * one — the HMAC-signed-deterministic credential scheme (lib/commerce/
 * order-credentials.ts) makes this a single counter bump, no stored
 * token to rotate. Useful if a link was shared somewhere it shouldn't
 * have been, or a buyer needs it resent to a corrected email address. */
export async function issueOrderCredentialRegeneration(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...ORDER_ROLES]);

  const orderId = str(formData.get('orderId'), 100);
  if (!orderId) return { error: 'missing' };

  const [before] = await db.select().from(s.commerceOrders).where(eq(s.commerceOrders.id, orderId)).limit(1);
  if (!before) return { error: 'not_found' };

  const newToken = await regenerateOrderCredential(orderId);
  if (!newToken) return { error: 'failed' };

  await recordAudit({
    adminUserId: me.id,
    action: 'commerce_order.regenerate_credential',
    entity: 'commerce_order',
    entityId: orderId,
    before: { credentialVersion: before.credentialVersion },
    after: { credentialVersion: before.credentialVersion + 1 },
  });

  revalidatePath(`/admin/orders/${orderId}`);

  return { ok: 'saved' };
}
