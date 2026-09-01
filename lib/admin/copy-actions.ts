'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { requireAdmin } from './guard';
import { recordAudit } from '@/lib/audit/log';
import { str } from '@/lib/checkout/validate';
import {
  copyKeys,
  copy,
  type CopyKey,
} from '@/lib/copy/defaults';

export type CopyState = {
  error?: string;
  ok?: string;
};

const VALID_KEYS = new Set<string>(
  copyKeys,
);

/**
 * Writes a site_copy override. Only keys that exist in defaults.ts are
 * accepted — an override for a key nothing reads is dead weight that silently
 * diverges from the codebase.
 */
export async function saveCopyOverride(
  _prev: CopyState,
  formData: FormData,
): Promise<CopyState> {
  const me = await requireAdmin();

  const key = str(
    formData.get('key'),
    200,
  );

  const value = str(
    formData.get('value'),
    4_000,
  );

  if (!key || !VALID_KEYS.has(key)) {
    return { error: 'unknown_key' };
  }

  const fallback = copy(
    key as CopyKey,
  );

  /*
   * Saving the default is a reset, not an
   * override. Keeping the row would freeze the
   * copy against future code changes.
   */
  if (!value || value === fallback) {
    await dbw
      .delete(s.siteCopy)
      .where(eq(s.siteCopy.key, key));

    await recordAudit({
      adminUserId: me.id,
      action: 'site_copy.reset',
      entity: 'site_copy',
      entityId: key,
      ipHash: null,
    });
  } else {
    await dbw
      .insert(s.siteCopy)
      .values({ key, value })
      .onConflictDoUpdate({
        target: s.siteCopy.key,
        set: {
          value,
          updatedAt: new Date(),
        },
      });

    await recordAudit({
      adminUserId: me.id,
      action: 'site_copy.update',
      entity: 'site_copy',
      entityId: key,
      before: { value: fallback },
      after: { value },
      ipHash: null,
    });
  }

  /*
   * Copy is read by nearly every page, so the
   * whole tree must revalidate or an edit
   * appears to do nothing.
   */
  revalidatePath('/', 'layout');
  revalidatePath('/admin/copy');

  return { ok: 'saved' };
}
