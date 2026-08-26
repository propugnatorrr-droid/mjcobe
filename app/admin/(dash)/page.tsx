import Link from 'next/link';
import { DollarSign, Clock, TrendingUp, Calendar, Users, Star, Music, AlertCircle } from 'lucide-react';
import { getOverview, listRecentTransactions, getDailyTotals } from '@/lib/admin/queries';
import { Metric, Table, Td, StateDot, AdminHeading } from '@/components/admin/ui';
import { TrendChart } from '@/components/admin/TrendChart';
import { admin } from '@/lib/copy/admin';
import { cents, formatCents } from '@/lib/money/cents';
import { formatDay } from '@/lib/song/queries';

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  const [data, recentRaw, daily] = await Promise.all([
    getOverview(),
    listRecentTransactions(),
    getDailyTotals(14),
  ]);
  const recent = await Promise.all(
    recentRaw.map(async (t) => ({ ...t, day: await formatDay(t.createdAt) })),
  );

  return (
    <>
      <AdminHeading>{admin.nav.overview}</AdminHeading>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric icon={DollarSign} label={admin.overview.totalRaised} value={formatCents(cents(data.totalCents))} accent />
        <Metric icon={Clock} label={admin.overview.today} value={formatCents(cents(data.todayCents))} />
        <Metric icon={TrendingUp} label={admin.overview.week} value={formatCents(cents(data.weekCents))} />
        <Metric icon={Calendar} label={admin.overview.month} value={formatCents(cents(data.monthCents))} />
        <Metric icon={Users} label={admin.overview.supporters} value={String(data.supporterCount)} />
        <Metric icon={Star} label={admin.overview.sponsors} value={String(data.sponsorCount)} />
        <Metric
          icon={Music}
          label={admin.overview.topSong}
          value={data.topSong ? data.topSong.title : admin.overview.none}
        />
        <Metric
          icon={AlertCircle}
          label={admin.overview.pendingReview}
          value={String(data.pendingSponsorCount)}
          accent={data.pendingSponsorCount > 0}
        />
      </div>

      {data.pendingSponsorCount > 0 ? (
        <Link
          href="/admin/sponsors"
          className="mt-6 inline-block font-mono text-eyebrow uppercase transition-opacity [transition-duration:var(--duration-signature)] hover:opacity-60"
          style={{ color: 'var(--champagne)' }}
        >
          {admin.sponsors.pending}
        </Link>
      ) : null}

      <h2 className="mt-16 mb-4 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
        {admin.overview.trend}
      </h2>
      <div
        className="rounded-[var(--radius-panel)] border p-6"
        style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
      >
        <TrendChart points={daily} />
      </div>

      <h2 className="mt-16 mb-4 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
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
