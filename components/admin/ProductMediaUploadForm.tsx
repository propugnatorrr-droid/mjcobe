'use client';

import { useActionState } from 'react';
import { uploadProductMedia } from '@/lib/shop/admin-actions';
import type { AdminState } from '@/lib/admin/actions';
import { admin } from '@/lib/copy/admin';
import type { AdminProductMediaRow } from '@/lib/shop/queries';

export function ProductMediaUploadForm({ productId, media }: { productId: string; media: AdminProductMediaRow[] }) {
  const [state, formAction] = useActionState<AdminState, FormData>(uploadProductMedia, {});

  return (
    <div className="max-w-2xl">
      <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.shop.media.heading}</p>

      {media.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-4">
          {media.map((item) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={item.id} src={item.path} alt="" width={96} height={96} className="h-24 w-24 rounded object-cover" style={{ backgroundColor: 'var(--ink)' }} />
          ))}
        </div>
      ) : null}

      <form action={formAction} encType="multipart/form-data" className="mt-4 flex flex-wrap items-end gap-4">
        <input type="hidden" name="productId" value={productId} />
        <input
          type="file"
          name="media"
          accept="image/png,image/webp,image/jpeg"
          className="border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
        />
        <button type="submit" className="mj-button mj-button--primary w-fit">
          {admin.shop.media.upload}
        </button>
      </form>
      <p className="mt-2 font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">{admin.shop.media.hint}</p>

      {state.ok ? <span className="font-mono text-[0.625rem] text-[var(--text-dim)]">{admin.saved}</span> : null}
      {state.error ? (
        <span className="font-mono text-[0.625rem]" style={{ color: 'var(--ember)' }}>
          {admin.failed}
        </span>
      ) : null}
    </div>
  );
}
