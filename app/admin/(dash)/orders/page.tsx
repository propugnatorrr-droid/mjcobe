import Link from 'next/link';
import { listAdminOrders } from '@/lib/commerce/admin-queries';
import { AdminHeading, AdminHint, StateDot, Table, Td } from '@/components/admin/ui';
import { formatCents, cents } from '@/lib/money/cents';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = await listAdminOrders();

  return (
    <>
      <AdminHeading>{admin.orders.heading}</AdminHeading>
      <AdminHint>{admin.orders.hint}</AdminHint>

      {orders.length === 0 ? (
        <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.orders.empty}</p>
      ) : (
        <Table head={[admin.orders.status, admin.orders.orderNumber, admin.orders.type, admin.orders.buyer, admin.orders.total, admin.orders.placed]}>
          {orders.map((order) => (
            <tr key={order.id}>
              <Td>
                <Link href={`/admin/orders/${order.id}`} className="hover:text-[var(--champagne)]">
                  <StateDot state={order.status} />
                </Link>
              </Td>
              <Td mono>
                <Link href={`/admin/orders/${order.id}`} className="hover:text-[var(--champagne)]">
                  {order.orderNumber}
                </Link>
              </Td>
              <Td dim mono>{order.orderType}</Td>
              <Td dim>{order.buyerEmail}</Td>
              <Td mono>{formatCents(cents(order.totalCents))}</Td>
              <Td dim mono nowrap>{order.createdAt.toLocaleDateString()}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
