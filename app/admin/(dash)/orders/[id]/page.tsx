import { notFound } from 'next/navigation';
import { getAdminOrder } from '@/lib/commerce/admin-queries';
import { OrderRefundForm } from '@/components/admin/OrderRefundForm';
import { RegenerateOrderLinkForm } from '@/components/admin/RegenerateOrderLinkForm';
import { ResendTicketsForm } from '@/components/admin/ResendTicketsForm';
import { AdminHeading, AdminHint, StateDot, Table, Td } from '@/components/admin/ui';
import { formatCents, cents } from '@/lib/money/cents';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getAdminOrder(id);

  if (!result) {
    notFound();
  }

  const { order, items, payments, refunds } = result;
  const settledPayment = payments.find((p) => p.state === 'settled');

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <AdminHeading>{order.orderNumber}</AdminHeading>
        <StateDot state={order.status} />
      </div>
      <AdminHint>{admin.orders.hint}</AdminHint>

      <div className="mb-8 max-w-2xl border p-4" style={{ borderColor: 'var(--line)' }}>
        <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.orders.buyer}</p>
        <p className="mt-2 font-serif text-lg text-[var(--text)]">{order.buyerEmail}</p>
        <p className="mt-1 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {order.orderType} · {formatCents(cents(order.totalCents))}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-6 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
          {order.orderType === 'ticket' ? <ResendTicketsForm orderId={order.id} /> : null}
        </div>
        <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
          <p className="mb-2 text-sm text-[var(--text-dim)]">{admin.orders.regenerateLinkHint}</p>
          <RegenerateOrderLinkForm orderId={order.id} />
        </div>
      </div>

      <p className="mb-3 font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.orders.items}</p>
      <Table head={[admin.orders.items, '', admin.orders.total]}>
        {items.map((item) => (
          <tr key={item.id}>
            <Td>{item.titleSnapshot}</Td>
            <Td dim mono>×{item.quantity}</Td>
            <Td mono>{formatCents(cents(item.lineTotalCents))}</Td>
          </tr>
        ))}
      </Table>

      <p className="mb-3 mt-10 font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.orders.payments}</p>
      <Table head={[admin.orders.provider, admin.orders.providerRef, admin.orders.status, admin.orders.total]}>
        {payments.map((payment) => (
          <tr key={payment.id}>
            <Td dim mono>{payment.provider}</Td>
            <Td dim mono>{payment.providerRef ?? '—'}</Td>
            <Td>
              <StateDot state={payment.state} />
            </Td>
            <Td mono>{formatCents(cents(payment.amountCents))}</Td>
          </tr>
        ))}
      </Table>

      {refunds.length > 0 ? (
        <>
          <p className="mb-3 mt-10 font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.orders.refunds}</p>
          <Table head={[admin.orders.status, admin.orders.total, admin.orders.refundReason]}>
            {refunds.map((refund) => (
              <tr key={refund.id}>
                <Td>
                  <StateDot state={refund.status} />
                </Td>
                <Td mono>{formatCents(cents(refund.amountCents))}</Td>
                <Td dim>{refund.reason}</Td>
              </tr>
            ))}
          </Table>
        </>
      ) : null}

      {settledPayment ? (
        <div className="mt-10 max-w-2xl">
          <p className="mb-4 font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.orders.issueRefund}</p>
          <OrderRefundForm orderId={order.id} paymentId={settledPayment.id} />
        </div>
      ) : null}
    </>
  );
}
