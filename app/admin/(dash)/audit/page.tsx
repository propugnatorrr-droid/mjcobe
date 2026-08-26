import { listAudit } from '@/lib/admin/queries';
import { AdminHeading, AdminHint, Table, Td } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';
import { formatDay } from '@/lib/song/queries';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const rows = await listAudit();

  return (
    <>
      <AdminHeading>{admin.audit.heading}</AdminHeading>
      <AdminHint>{admin.audit.hint}</AdminHint>

      <Table
        head={[
          admin.table.date, admin.table.admin, admin.table.action,
          admin.table.entity, admin.table.reason,
        ]}
      >
        {rows.map(async (r) => (
          <tr key={r.id}>
            <Td mono dim>{await formatDay(r.createdAt)}</Td>
            <Td mono dim>{r.adminEmail ?? '—'}</Td>
            <Td mono>{r.action}</Td>
            <Td mono dim>{`${r.entity} ${r.entityId ?? ''}`.trim()}</Td>
            <Td dim>{r.reason ?? '—'}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
