'use client';

import { useActionState } from 'react';
import { createVariant, updateVariant, adjustInventory } from '@/lib/shop/admin-actions';
import type { AdminState } from '@/lib/admin/actions';
import { AdminInput, AdminSelect } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';
import type { AdminVariant } from '@/lib/shop/queries';

const REASON_OPTIONS = Object.entries(admin.shop.variants.reasons).map(([value, label]) => ({ value, label }));

function centsToDollarsString(cents: number | null): string {
  if (cents === null) return '';
  return (cents / 100).toFixed(2);
}

function AdjustStockForm({ variantId }: { variantId: string }) {
  const [state, formAction] = useActionState<AdminState, FormData>(adjustInventory, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="variantId" value={variantId} />

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.shop.variants.delta}</span>
        <AdminInput name="delta" placeholder="+10" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.shop.variants.reason}</span>
        <AdminSelect name="reason" options={REASON_OPTIONS} defaultValue="restock" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.shop.variants.note}</span>
        <AdminInput name="note" wide />
      </label>

      <button type="submit" className="font-mono text-[0.625rem] uppercase text-[var(--champagne)] hover:opacity-70">
        {admin.shop.variants.adjustStock}
      </button>

      {state.ok ? <span className="font-mono text-[0.625rem] text-[var(--text-dim)]">{admin.saved}</span> : null}
      {state.error ? (
        <span className="font-mono text-[0.625rem]" style={{ color: 'var(--ember)' }}>
          {admin.failed}
        </span>
      ) : null}
    </form>
  );
}

function VariantRow({ variant }: { variant: AdminVariant }) {
  const [updateState, updateAction] = useActionState<AdminState, FormData>(updateVariant, {});

  return (
    <div className="flex flex-col gap-4 border-b py-6" style={{ borderColor: 'var(--line)' }}>
      <form action={updateAction} className="flex flex-wrap items-end gap-4">
        <input type="hidden" name="id" value={variant.id} />

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.shop.variants.name}</span>
          <AdminInput name="name" defaultValue={variant.name} wide />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.shop.variants.sku}</span>
          <AdminInput name="sku" defaultValue={variant.sku} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.shop.variants.price}</span>
          <AdminInput name="price" defaultValue={centsToDollarsString(variant.priceCents)} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.shop.variants.compareAt}</span>
          <AdminInput name="compareAt" defaultValue={centsToDollarsString(variant.compareAtCents)} />
        </label>

        <label className="flex items-center gap-2 font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">
          <input type="checkbox" name="isActive" defaultChecked={variant.isActive} className="h-4 w-4 accent-[var(--champagne)]" />
          {admin.shop.variants.active}
        </label>

        <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">
          {admin.shop.variants.stock}: <strong className="text-[var(--text)]">{variant.stockOnHand}</strong>
        </span>

        <button type="submit" className="font-mono text-[0.625rem] uppercase text-[var(--champagne)] hover:opacity-70">
          {admin.actions.save}
        </button>

        {updateState.ok ? <span className="font-mono text-[0.625rem] text-[var(--text-dim)]">{admin.saved}</span> : null}
      </form>

      <AdjustStockForm variantId={variant.id} />
    </div>
  );
}

function AddVariantForm({ productId }: { productId: string }) {
  const [state, formAction] = useActionState<AdminState, FormData>(createVariant, {});

  return (
    <form action={formAction} className="mt-6 flex flex-wrap items-end gap-4">
      <input type="hidden" name="productId" value={productId} />

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.shop.variants.name}</span>
        <AdminInput name="name" wide />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.shop.variants.sku}</span>
        <AdminInput name="sku" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.shop.variants.price}</span>
        <AdminInput name="price" placeholder="0.00" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.shop.variants.compareAt}</span>
        <AdminInput name="compareAt" placeholder="0.00" />
      </label>

      <button type="submit" className="mj-button mj-button--primary w-fit">
        {admin.shop.variants.add}
      </button>

      {state.ok ? <span className="font-mono text-[0.625rem] text-[var(--text-dim)]">{admin.saved}</span> : null}
      {state.error ? (
        <span className="font-mono text-[0.625rem]" style={{ color: 'var(--ember)' }}>
          {admin.failed}
        </span>
      ) : null}
    </form>
  );
}

export function VariantManager({ productId, variants }: { productId: string; variants: AdminVariant[] }) {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.shop.variants.heading}</p>
      <p className="mt-2 max-w-[52ch] text-sm text-[var(--text-dim)]">{admin.shop.variants.hint}</p>

      {variants.length === 0 ? (
        <p className="mt-6 font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.shop.variants.empty}</p>
      ) : (
        <div className="mt-6">
          {variants.map((variant) => (
            <VariantRow key={variant.id} variant={variant} />
          ))}
        </div>
      )}

      <AddVariantForm productId={productId} />
    </div>
  );
}
