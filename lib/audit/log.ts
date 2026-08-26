import 'server-only';
import { dbw } from '@/lib/db/write';
import { auditLog } from '@/lib/db/schema';

/** Every admin mutation lands here. No exceptions, no silent paths. */
export async function recordAudit(entry: {
  adminUserId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  ipHash?: string | null;
}): Promise<void> {
  await dbw.insert(auditLog).values({
    adminUserId: entry.adminUserId ?? null,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    before: (entry.before ?? null) as never,
    after: (entry.after ?? null) as never,
    reason: entry.reason ?? null,
    ipHash: entry.ipHash ?? null,
  });
}
