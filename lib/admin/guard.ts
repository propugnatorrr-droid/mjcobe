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
