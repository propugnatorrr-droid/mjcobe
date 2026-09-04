'use client';

import { useActionState } from 'react';
import { createProduct, updateProduct } from '@/lib/shop/admin-actions';
import type { AdminState } from '@/lib/admin/actions';
import { AdminSelect } from '@/components/admin/ui';
import { Field, CheckField } from '@/components/primitives/Field';
import { admin } from '@/lib/copy/admin';
import type { AdminProduct } from '@/lib/shop/queries';

const STATUS_OPTIONS = Object.entries(admin.shop.statuses).map(([value, label]) => ({ value, label }));

function toDatetimeLocalValue(value: Date | null): string {
  if (!value) return '';
  const offsetMs = value.getTimezoneOffset() * 60 * 1000;
  return new Date(value.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function ProductForm({ product }: { product?: AdminProduct }) {
  const action = product ? updateProduct : createProduct;
  const [state, formAction] = useActionState<AdminState, FormData>(action, {});

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <Field label={admin.shop.title} name="title" defaultValue={product?.title} required />
      <Field label={admin.shop.slug} name="slug" defaultValue={product?.slug} placeholder={admin.shop.slug} />

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.shop.description}</span>
        <textarea
          name="description"
          defaultValue={product?.description ?? ''}
          rows={4}
          className="w-full border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.shop.status}</span>
        <AdminSelect name="status" options={STATUS_OPTIONS} defaultValue={product?.status ?? 'draft'} />
      </label>

      <Field label={admin.shop.sortIndex} name="sortIndex" defaultValue={product ? String(product.sortIndex) : '0'} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.shop.saleStartAt}</span>
          <input
            type="datetime-local"
            name="saleStartAt"
            defaultValue={toDatetimeLocalValue(product?.saleStartAt ?? null)}
            className="border-b border-[var(--line)] bg-transparent pb-2 font-mono text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.shop.saleEndAt}</span>
          <input
            type="datetime-local"
            name="saleEndAt"
            defaultValue={toDatetimeLocalValue(product?.saleEndAt ?? null)}
            className="border-b border-[var(--line)] bg-transparent pb-2 font-mono text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
          />
        </label>
      </div>

      <CheckField label={admin.shop.featured} name="featured" defaultChecked={product?.featured ?? false} />
      <CheckField label={admin.shop.shippingRequired} name="shippingRequired" defaultChecked={product?.shippingRequired ?? true} />

      <button type="submit" className="mj-button mj-button--primary w-fit">
        {admin.actions.save}
      </button>

      {state.ok ? (
        <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.saved}</p>
      ) : null}
      {state.error ? (
        <p className="font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {admin.failed}
        </p>
      ) : null}
    </form>
  );
}
