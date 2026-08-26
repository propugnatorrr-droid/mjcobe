import { FundingMeter } from '@/components/primitives/FundingMeter';
import { CountUp } from '@/components/primitives/CountUp';
import { AmountFigure } from '@/components/primitives/AmountFigure';
import { cents } from '@/lib/money/cents';
import { formatCents } from '@/lib/money/cents';
import { text } from '@/lib/copy/site-copy';
import type { SongPageData } from '@/lib/song/queries';

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
        {label}
      </span>
      <span className="font-mono text-2xl text-[var(--text)] md:text-3xl">
        {children}
      </span>
    </div>
  );
}

export async function FundingPanel({
  totals,
  daysLeft,
  isAcceptingSupport,
}: Pick<SongPageData, 'totals' | 'daysLeft' | 'isAcceptingSupport'>) {
  const timeLabel = !isAcceptingSupport
    ? await text('song.meter.closed')
    : daysLeft === null
      ? await text('song.meter.open_ended')
      : daysLeft === 0
        ? await text('song.meter.final_day')
        : await text('song.meter.days_left');

  const timeValue =
    !isAcceptingSupport || daysLeft === null || daysLeft === 0
      ? '—'
      : String(daysLeft);

  return (
    <section className="py-16 md:py-24">
      <div className="mb-12 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
        <Stat label={await text('song.meter.raised')}>
          <CountUp cents={cents(totals.meterCents)} />
        </Stat>
        <Stat label={await text('song.meter.goal')}>
          <AmountFigure cents={cents(totals.goalCents)} />
        </Stat>
        <Stat label={await text('song.meter.supporters')}>
          <CountUp value={totals.supporterCount} />
        </Stat>
        <Stat label={timeLabel}>{timeValue}</Stat>
      </div>

      <FundingMeter percent={totals.percent} />

      {totals.sponsorCents > 0 ? (
        <p className="mt-6 max-w-[62ch] text-body text-[var(--text-dim)]">
          {await text('song.meter.sponsorship_note', {
            amount: formatCents(cents(totals.sponsorCents)),
          })}
        </p>
      ) : null}
    </section>
  );
}
