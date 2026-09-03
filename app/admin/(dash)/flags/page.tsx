import { redirect } from 'next/navigation';
import { listFeatureFlags } from '@/lib/admin/queries';
import { AdminAuthorizationError, requireAdminRole } from '@/lib/admin/guard';
import { FlagRow } from '@/components/admin/FlagRow';
import { AdminHeading, AdminHint } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

export default async function FlagsPage() {
  try {
    await requireAdminRole([]);
  } catch (error) {
    if (error instanceof AdminAuthorizationError) redirect('/admin');
    throw error;
  }

  const rows = await listFeatureFlags();

  return (
    <>
      <AdminHeading>{admin.flags.heading}</AdminHeading>
      <AdminHint>{admin.flags.hint}</AdminHint>

      <div className="max-w-3xl border-t border-[var(--line-strong)]">
        {rows.length === 0 ? (
          <p className="py-5 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {admin.flags.empty}
          </p>
        ) : (
          rows.map((row) => (
            <FlagRow
              key={row.key}
              flagKey={row.key}
              enabled={row.enabled}
              description={row.description}
            />
          ))
        )}
        <FlagRow flagKey="" enabled={false} description={null} isNew />
      </div>
    </>
  );
}
