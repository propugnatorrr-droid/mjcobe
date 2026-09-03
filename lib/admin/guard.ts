import 'server-only';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { readSession } from './session';

export type AdminIdentity = {
  id: string;
  email: string;
  name: string | null;
  role: (typeof s.adminUsers.$inferSelect)['role'];
};

/**
 * A valid cookie is not enough — the account must still exist and be active,
 * so revoking access is a single database update rather than a secret rotation.
 */
export async function requireAdmin(): Promise<AdminIdentity> {
  const session = await readSession();
  if (!session) redirect('/admin/login');

  const [row] = await db
    .select()
    .from(s.adminUsers)
    .where(and(eq(s.adminUsers.email, session.email), eq(s.adminUsers.isActive, true)))
    .limit(1);

  if (!row) redirect('/admin/login');

  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export type AdminRole = AdminIdentity['role'];

/**
 * Every admin who can log in has always had full access — `requireAdmin()`
 * alone never checked `role`. This is the first real enforcement point.
 * `super_admin` is always allowed regardless of the `allowed` list, matching
 * the role's meaning everywhere else it's referenced in this codebase.
 */
export class AdminAuthorizationError extends Error {
  constructor(message = 'Your admin role does not permit this action.') {
    super(message);
    this.name = 'AdminAuthorizationError';
  }
}

export async function requireAdminRole(allowed: AdminRole[]): Promise<AdminIdentity> {
  const me = await requireAdmin();
  if (me.role !== 'super_admin' && !allowed.includes(me.role)) {
    throw new AdminAuthorizationError();
  }
  return me;
}
