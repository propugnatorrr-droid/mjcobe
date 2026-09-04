'use client';

import { useActionState } from 'react';
import { updateFulfillment } from '@/lib/shop/admin-actions';
import type { AdminState } from '@/lib/admin/actions';
import { AdminInput, AdminSelect } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';
import type { AdminOrderDetail } from '@/lib/commerce/admin-queries';

const STATUS_OPTIONS = Object.entries(admin.orders.fulfillment.statuses).map(([value, label]) => ({ value, label }));

export function FulfillmentForm({
  orderId,
  fulfillment,
  shippingAddress,
}: {
  orderId: string;
  fulfillment: NonNullable<AdminOrderDetail['fulfillment']>;
  shippingAddress: AdminOrderDetail['shippingAddress'];
}) {
  const [state, formAction] = useActionState<AdminState, FormData>(updateFulfillment, {});

  return (
    <div className="max-w-2xl">
      <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.orders.fulfillment.heading}</p>

      {shippingAddress ? (
        <div className="mt-4 border p-4" style={{ borderColor: 'var(--line)' }}>
          <p className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.orders.fulfillment.shipTo}</p>
          <p className="mt-2 text-body text-[var(--text)]">{shippingAddress.recipientName}</p>
          <p className="text-sm text-[var(--text-dim)]">
            {shippingAddress.line1}
            {shippingAddress.line2 ? `, ${shippingAddress.line2}` : ''}
          </p>
          <p className="text-sm text-[var(--text-dim)]">
            {shippingAddress.city}
            {shippingAddress.region ? `, ${shippingAddress.region}` : ''} {shippingAddress.postalCode}
          </p>
          <p className="text-sm text-[var(--text-dim)]">{shippingAddress.country}</p>
        </div>
      ) : null}

      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-4">
        <input type="hidden" name="orderId" value={orderId} />

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.orders.fulfillment.status}</span>
          <AdminSelect name="status" options={STATUS_OPTIONS} defaultValue={fulfillment.status} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.orders.fulfillment.carrier}</span>
          <AdminInput name="carrier" defaultValue={fulfillment.carrier ?? ''} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.orders.fulfillment.trackingNumber}</span>
          <AdminInput name="trackingNumber" defaultValue={fulfillment.trackingNumber ?? ''} wide />
        </label>

        <label className="flex w-full flex-col gap-1">
          <span className="font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.orders.fulfillment.notes}</span>
          <AdminInput name="notes" defaultValue={fulfillment.notes ?? ''} wide />
        </label>

        <button type="submit" className="mj-button mj-button--primary w-fit">
          {admin.actions.save}
        </button>

        {state.ok ? <span className="font-mono text-[0.625rem] text-[var(--text-dim)]">{admin.saved}</span> : null}
      </form>
    </div>
  );
}
