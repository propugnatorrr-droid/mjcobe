'use server';

import {
  revalidatePath,
} from 'next/cache';
import {
  eq,
} from 'drizzle-orm';
import {
  dbw,
} from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import {
  requireAdmin,
} from './guard';
import {
  recordAudit,
} from '@/lib/audit/log';
import {
  str,
} from '@/lib/checkout/validate';
import {
  copyKeys,
  copy,
  type CopyKey,
} from '@/lib/copy/defaults';

const VALID_KEYS = new Set<string>(
  copyKeys,
);

/**
 * Direct server form action. Errors are rejected without changing data.
 */
export async function saveCopyOverride(
  formData: FormData,
): Promise<void> {
  const me = await requireAdmin();

  const key = str(
    formData.get('key'),
    200,
  );

  const value = str(
    formData.get('value'),
    4_000,
  );

  if (
    !key ||
    !VALID_KEYS.has(key)
  ) {
    return;
  }

  const fallback = copy(
    key as CopyKey,
  );

  /*
   * Saving the fallback value clears the
   * override, allowing future code defaults
   * to take effect.
   */
  if (
    !value ||
    value === fallback
  ) {
    await dbw
      .delete(s.siteCopy)
      .where(
        eq(
          s.siteCopy.key,
          key,
        ),
      );

    await recordAudit({
      adminUserId: me.id,
      action:
        'site_copy.reset',
      entity: 'site_copy',
      entityId: key,
    });
  } else {
    await dbw
      .insert(s.siteCopy)
      .values({
        key,
        value,
        updatedByAdminId:
          me.id,
      })
      .onConflictDoUpdate({
        target: s.siteCopy.key,
        set: {
          value,
          updatedAt:
            new Date(),
          updatedByAdminId:
            me.id,
        },
      });

    await recordAudit({
      adminUserId: me.id,
      action:
        'site_copy.update',
      entity: 'site_copy',
      entityId: key,
      before: {
        value: fallback,
      },
      after: {
        value,
      },
    });
  }

  revalidatePath(
    '/',
    'layout',
  );

  revalidatePath(
    '/admin/copy',
  );
}
