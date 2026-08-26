import Link from 'next/link';
import { getOverview, listRecentTransactions } from '@/lib/admin/queries';
import { Metric, Table, Td, StateDot, AdminHeading } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';
import { cents, formatCents } from '@/lib/money/cents';
import { formatDay } from '@/lib/song/queries';

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  const [data, recentRaw] = await Promise.all([getOverview(), listRecentTransactions()]);
  const recent = await Promise.all(
    recentRaw.map(async (t) => ({ ...t, day: await formatDay(t.createdAt) })),
  );

  return (
    <>
      <AdminHeading>{admin.nav.overview}</AdminHeading>

      <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
        <Metric label={admin.overview.totalRaised} value={formatCents(cents(data.totalCents))} accent />
        <Metric label={admin.overview.today} value={formatCents(cents(data.todayCents))} />
        <Metric label={admin.overview.week} value={formatCents(cents(data.weekCents))} />
        <Metric label={admin.overview.month} value={formatCents(cents(data.monthCents))} />
        <Metric label={admin.overview.supporters} value={String(data.supporterCount)} />
        <Metric label={admin.overview.sponsors} value={String(data.sponsorCount)} />
        <Metric
          label={admin.overview.topSong}
          value={data.topSong ? data.topSong.title : admin.overview.none}
        />
        <Metric
          label={admin.overview.pendingReview}
          value={String(data.pendingSponsorCount)}
          accent={data.pendingSponsorCount > 0}
        />
      </div>

      {data.pendingSponsorCount > 0 ? (
        <Link
          href="/admin/sponsors"
          className="mt-10 inline-block font-mono text-eyebrow uppercase transition-opacity [transition-duration:var(--duration-signature)] hover:opacity-60"
          style={{ color: 'var(--champagne)' }}
        >
          {admin.sponsors.pending}
        </Link>
      ) : null}

      <h2 className="mt-20 mb-6 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
        {admin.overview.recent}
      </h2>

      <Table head={[admin.table.date, admin.table.song, admin.table.amount, admin.table.state]}>
        {recent.map((t) => (
          <tr key={t.id}>
            <Td mono dim>{t.day}</Td>
            <Td>{t.songTitle}</Td>
            <Td mono>{formatCents(cents(t.amountCents))}</Td>
            <Td><StateDot state={t.state} /></Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
