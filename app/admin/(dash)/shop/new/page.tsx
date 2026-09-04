import { AdminHeading, AdminHint } from '@/components/admin/ui';
import { ProductForm } from '@/components/admin/ProductForm';
import { admin } from '@/lib/copy/admin';

export default function NewProductPage() {
  return (
    <>
      <AdminHeading>{admin.shop.createHeading}</AdminHeading>
      <AdminHint>{admin.shop.hint}</AdminHint>
      <ProductForm />
    </>
  );
}
