'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { dbw } from '@/lib/db/write';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { requireAdminRole } from './guard';
import { recordAudit } from '@/lib/audit/log';
import { str, bool } from '@/lib/checkout/validate';
import type { AdminState } from './actions';

/**
 * Feature-flag administration is super_admin-only (per the launch decision
 * table) — flags gate whether unfinished commerce/feed/ticketing surfaces
 * are visible to the public at all, so this is the one setting-like admin
 * surface that gets tighter authorization than "any logged-in admin."
 */
export async function saveFeatureFlag(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const me = await requireAdminRole([]);

  const key = str(formData.get('key'), 100);
  if (!key) return { error: 'missing' };

  const enabled = bool(formData.get('enabled'));
  const description = str(formData.get('description'), 500) ?? '';

  const [before] = await db
    .select()
    .from(s.featureFlags)
    .where(eq(s.featureFlags.key, key))
    .limit(1);

  await dbw
    .insert(s.featureFlags)
    .values({ key, enabled, description })
    .onConflictDoUpdate({
      target: s.featureFlags.key,
      set: { enabled, description },
    });

  await recordAudit({
    adminUserId: me.id,
    action: 'feature_flag.save',
    entity: 'feature_flag',
    entityId: key,
    before: before ? { enabled: before.enabled, description: before.description } : null,
    after: { enabled, description },
  });

  revalidatePath('/admin/flags');
  revalidatePath('/', 'layout');

  return { ok: 'saved' };
}

export async function deleteFeatureFlag(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const me = await requireAdminRole([]);

  const key = str(formData.get('key'), 100);
  if (!key) return { error: 'missing' };

  await dbw.delete(s.featureFlags).where(eq(s.featureFlags.key, key));

  await recordAudit({
    adminUserId: me.id,
    action: 'feature_flag.delete',
    entity: 'feature_flag',
    entityId: key,
  });

  revalidatePath('/admin/flags');
  revalidatePath('/', 'layout');

  return { ok: 'saved' };
}
