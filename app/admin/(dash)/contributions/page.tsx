import Link from 'next/link';
import { listContributions } from '@/lib/admin/queries';
import { moderateContribution, blockFromContribution } from '@/lib/admin/actions';
import { RefundForm } from '@/components/admin/RefundForm';
import { AdminHeading, Table, Td, InlineAction, StateDot, AdminInput } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';
import { cents, formatCents } from '@/lib/money/cents';
import { formatDay } from '@/lib/song/queries';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ moderation?: string; type?: string }> };

const FILTERS = ['pending', 'approved', 'flagged', 'hidden', 'blocked'];

export default async function ContributionsPage({ searchParams }: Props) {
  const { moderation, type } = await searchParams;
  const rows = await listContributions({ moderation, supportType: type });

  return (
    <>
      <AdminHeading>{admin.nav.contributions}</AdminHeading>

      <div className="mb-10 flex flex-wrap gap-x-6 gap-y-2">
        <Link
          href="/admin/contributions"
          className="font-mono text-eyebrow uppercase text-[var(--text-dim)] hover:text-[var(--text)]"
        >
          {admin.actions.all}
        </Link>
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/contributions?moderation=${f}`}
            className="font-mono text-eyebrow uppercase hover:text-[var(--text)]"
            style={{ color: moderation === f ? 'var(--text)' : 'var(--text-dim)' }}
          >
            {f}
          </Link>
        ))}
      </div>

      <Table
        head={[
          admin.table.date, admin.table.name, admin.table.song, admin.table.type,
          admin.table.amount, admin.table.net, admin.table.state,
          admin.table.moderation, admin.table.actions,
        ]}
      >
        {rows.map(async (row) => (
          <tr key={row.contributionId}>
            <Td mono dim>{await formatDay(row.occurredAt)}</Td>
            <Td>
              <form action={moderateContribution} className="flex items-center gap-3">
                <input type="hidden" name="contributionId" value={row.contributionId} />
                <input type="hidden" name="action" value="rename" />
                <AdminInput name="displayName" defaultValue={row.name} />
                <InlineAction>{admin.actions.rename}</InlineAction>
              </form>
            </Td>
            <Td dim>{row.songTitle}</Td>
            <Td mono dim>{row.supportType}</Td>
            <Td mono>{formatCents(cents(row.amountCents))}</Td>
            <Td mono dim>{formatCents(cents(row.netCents))}</Td>
            <Td><StateDot state={row.state} /></Td>
            <Td mono dim>{row.moderation}</Td>
            <Td>
              <div className="flex flex-wrap items-center gap-4">
                {(['approve', 'flag', row.leaderboardVisible ? 'hide' : 'unhide'] as const).map(
                  (act) => (
                    <form key={act} action={moderateContribution}>
                      <input type="hidden" name="contributionId" value={row.contributionId} />
                      <input type="hidden" name="action" value={act} />
                      <InlineAction>
                        {act === 'approve'
                          ? admin.actions.approve
                          : act === 'flag'
                            ? admin.actions.flag
                            : act === 'hide'
                              ? admin.actions.hide
                              : admin.actions.unhide}
                      </InlineAction>
                    </form>
                  ),
                )}

                {row.email ? (
                  <form action={blockFromContribution}>
                    <input type="hidden" name="contributionId" value={row.contributionId} />
                    <input type="hidden" name="blockKind" value="email" />
                    <input type="hidden" name="blockValue" value={row.email} />
                    <InlineAction danger>{admin.actions.block}</InlineAction>
                  </form>
                ) : null}

                {row.transactionId && row.netCents > 0 ? (
                  <RefundForm
                    transactionId={row.transactionId}
                    maxLabel={formatCents(cents(row.netCents))}
                  />
                ) : null}
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
