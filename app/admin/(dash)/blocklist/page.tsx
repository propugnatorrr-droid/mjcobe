import { listBlocklist } from '@/lib/admin/queries';
import { removeBlocklistEntry } from '@/lib/admin/actions';
import { AdminHeading, AdminHint, Table, Td, InlineAction } from '@/components/admin/ui';
import { BlocklistForm } from '@/components/admin/BlocklistForm';
import { admin } from '@/lib/copy/admin';
import { formatDay } from '@/lib/song/queries';

export const dynamic = 'force-dynamic';

export default async function BlocklistPage() {
  const rows = await listBlocklist();

  return (
    <>
      <AdminHeading>{admin.blocklist.heading}</AdminHeading>
      <AdminHint>{admin.blocklist.hint}</AdminHint>

      <BlocklistForm />

      <div className="mt-8">
        {rows.length === 0 ? (
          <p className="text-body text-[var(--text-dim)]">{admin.blocklist.empty}</p>
        ) : (
          <Table head={[admin.blocklist.kind, admin.blocklist.value, admin.table.date, admin.blocklist.note, '']}>
            {rows.map(async (row) => (
              <tr key={row.id}>
                <Td dim>{admin.blocklist.kinds[row.kind]}</Td>
                <Td mono>{row.value}</Td>
                <Td mono dim>{await formatDay(row.createdAt)}</Td>
                <Td dim>{row.note ?? '—'}</Td>
                <Td nowrap>
                  <form action={removeBlocklistEntry}>
                    <input type="hidden" name="id" value={row.id} />
                    <InlineAction danger>{admin.blocklist.remove}</InlineAction>
                  </form>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </>
  );
}
