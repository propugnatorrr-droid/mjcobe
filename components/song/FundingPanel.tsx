import { CountUp } from '@/components/primitives/CountUp';
import { cents, formatCents } from '@/lib/money/cents';
import { text } from '@/lib/copy/site-copy';
import type { SongPageData } from '@/lib/song/queries';

/**
 * The money moment. The mockups give this its own full-width band: the raised
 * figure and supporter count on the left, the meter running across, and the
 * funded percentage anchoring the right.
 */
export async function FundingPanel({
  totals,
  daysLeft,
  isAcceptingSupport,
  objective,
}: Pick<SongPageData, 'totals' | 'daysLeft' | 'isAcceptingSupport'> & {
  objective?: string | null;
}) {
  const [backed, supportersLabel, ofGoal, goalLabel, sponsorNote] = await Promise.all([
    text('song.backed'),
    text('song.meter.supporters'),
    text('song.of_goal'),
    text('song.campaign_goal'),
    totals.sponsorCents > 0
      ? text('song.meter.sponsorship_note', {
          amount: formatCents(cents(totals.sponsorCents)),
        })
      : Promise.resolve(''),
  ]);

  const timeLabel = !isAcceptingSupport
    ? await text('song.meter.closed')
    : daysLeft === null
      ? await text('song.meter.open_ended')
      : daysLeft === 0
        ? await text('song.meter.final_day')
        : await text('song.meter.days_left');

  const timeValue =
    !isAcceptingSupport || daysLeft === null || daysLeft === 0 ? null : String(daysLeft);

  return (
    <section
      className="border-y py-10"
      style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
    >
      <div className="mx-auto max-w-[92rem] px-6 md:px-10">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[auto_auto_1fr_auto]">
          <div>
            <p className="font-serif text-[clamp(2.25rem,5vw,3.5rem)] leading-none text-gold">
              {formatCents(cents(totals.meterCents))}
            </p>
            <p className="mt-2 font-ui text-[0.625rem] uppercase tracking-[0.28em] text-[var(--text-dim)]">
              {backed}
            </p>
          </div>

          <div className="lg:pl-6">
            <p className="font-serif text-[clamp(1.75rem,3.6vw,2.5rem)] leading-none text-[var(--text)]">
              <CountUp value={totals.supporterCount} />
            </p>
            <p className="mt-2 font-ui text-[0.625rem] uppercase tracking-[0.28em] text-[var(--text-dim)]">
              {supportersLabel}
            </p>
          </div>

          <div className="lg:px-6">
            <div
              className="h-2.5 w-full overflow-hidden rounded-full"
              style={{ background: 'var(--line)' }}
            >
              <div
                className="bg-gold h-full rounded-full"
                style={{
                  width: `${Math.min(100, totals.percent)}%`,
                  transition: 'width var(--duration-signature) var(--ease-signature)',
                }}
              />
            </div>
            <p className="mt-3 font-ui text-[0.625rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
              {goalLabel}: <span className="font-mono">{formatCents(cents(totals.goalCents))}</span>
              {timeValue ? (
                <>
                  {' · '}
                  <span className="font-mono">{timeValue}</span> {timeLabel}
                </>
              ) : (
                <> · {timeLabel}</>
              )}
            </p>
          </div>

          <div className="lg:text-right">
            <p className="font-serif text-[clamp(2rem,4.5vw,3rem)] leading-none text-gold">
              {totals.percent}%
            </p>
            <p className="mt-2 font-ui text-[0.625rem] uppercase tracking-[0.28em] text-[var(--text-dim)]">
              {ofGoal}
            </p>
          </div>
        </div>

        {objective ? (
          <p className="mt-8 max-w-[76ch] text-body text-[var(--text-dim)]">{objective}</p>
        ) : null}

        {sponsorNote ? (
          <p className="mt-3 max-w-[76ch] font-ui text-xs text-[var(--text-faint)]">{sponsorNote}</p>
        ) : null}
      </div>
    </section>
  );
}
