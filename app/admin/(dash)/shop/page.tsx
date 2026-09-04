import Link from 'next/link';
import { listAdminProducts } from '@/lib/shop/queries';
import { AdminHeading, AdminHint, StateDot, Table, Td } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

export default async function AdminShopPage() {
  const products = await listAdminProducts();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <AdminHeading>{admin.shop.heading}</AdminHeading>
          <AdminHint>{admin.shop.hint}</AdminHint>
        </div>

        <Link
          href="/admin/shop/new"
          className="font-mono text-eyebrow uppercase text-[var(--champagne)] transition-opacity [transition-duration:var(--duration-signature)] hover:opacity-70"
        >
          + {admin.shop.create}
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.shop.empty}</p>
      ) : (
        <Table head={[admin.shop.status, admin.shop.title, admin.shop.slug]}>
          {products.map((product) => (
            <tr key={product.id}>
              <Td>
                <Link href={`/admin/shop/${product.id}`} className="hover:text-[var(--champagne)]">
                  <StateDot state={product.status} />
                </Link>
              </Td>
              <Td>
                <Link href={`/admin/shop/${product.id}`} className="hover:text-[var(--champagne)]">
                  {product.title}
                </Link>
              </Td>
              <Td dim mono>{product.slug}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
