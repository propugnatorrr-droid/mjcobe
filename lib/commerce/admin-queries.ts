import 'server-only';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';

export type AdminOrderRow = typeof s.commerceOrders.$inferSelect;

export async function listAdminOrders(): Promise<AdminOrderRow[]> {
  return db.select().from(s.commerceOrders).orderBy(desc(s.commerceOrders.createdAt));
}

export type AdminOrderDetail = {
  order: AdminOrderRow;
  items: (typeof s.commerceOrderItems.$inferSelect)[];
  payments: (typeof s.commercePayments.$inferSelect)[];
  refunds: (typeof s.commerceRefunds.$inferSelect)[];
};

export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  const [order] = await db.select().from(s.commerceOrders).where(eq(s.commerceOrders.id, id)).limit(1);
  if (!order) return null;

  const [items, payments] = await Promise.all([
    db.select().from(s.commerceOrderItems).where(eq(s.commerceOrderItems.orderId, id)),
    db.select().from(s.commercePayments).where(eq(s.commercePayments.orderId, id)),
  ]);

  const paymentIds = payments.map((p) => p.id);
  const refunds = paymentIds.length
    ? await db.select().from(s.commerceRefunds).where(inArray(s.commerceRefunds.paymentId, paymentIds))
    : [];

  return { order, items, payments, refunds };
}
