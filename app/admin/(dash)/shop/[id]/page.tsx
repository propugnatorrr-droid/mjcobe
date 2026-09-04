import { notFound } from 'next/navigation';
import { getAdminProduct } from '@/lib/shop/queries';
import { ProductForm } from '@/components/admin/ProductForm';
import { ProductMediaUploadForm } from '@/components/admin/ProductMediaUploadForm';
import { VariantManager } from '@/components/admin/VariantManager';
import { AdminHeading, AdminHint, StateDot } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function AdminProductPage({ params }: Props) {
  const { id } = await params;
  const result = await getAdminProduct(id);

  if (!result) {
    notFound();
  }

  const { product, variants, media } = result;

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <AdminHeading>{product.title}</AdminHeading>
        <StateDot state={product.status} />
      </div>
      <AdminHint>{admin.shop.hint}</AdminHint>

      <div className="max-w-2xl">
        <ProductForm product={product} />
      </div>

      <div className="mt-14">
        <ProductMediaUploadForm productId={product.id} media={media} />
      </div>

      <div className="mt-14">
        <VariantManager productId={product.id} variants={variants} />
      </div>
    </>
  );
}
