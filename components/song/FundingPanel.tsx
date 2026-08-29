import { CountUp } from '@/components/primitives/CountUp';
import { FundingMeter } from '@/components/primitives/FundingMeter';
import { cents, formatCents } from '@/lib/money/cents';
import { text } from '@/lib/copy/site-copy';
import type { SongPageData } from '@/lib/song/queries';

type FundingPanelProps = Pick<
  SongPageData,
  'totals' | 'daysLeft' | 'isAcceptingSupport'
> & {
  objective?: string | null;
};

export async function FundingPanel({
  totals,
  daysLeft,
  isAcceptingSupport,
  objective,
}: FundingPanelProps) {
  const [
    backed,
    supportersLabel,
    goalLabel,
    sponsorNote,
  ] = await Promise.all([
    text('song.backed'),
    text('song.meter.supporters'),
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

  const percent = Math.min(100, Math.max(0, totals.percent));

  return (
    <section
      aria-label={backed}
      className="song-v2-funding border-y border-[var(--line)] bg-[var(--ink-2)]"
    >
      <div className="site-shell py-8 sm:py-10">
        <div
          className={[
            'grid grid-cols-2 gap-x-6 gap-y-8',
            'lg:grid-cols-[minmax(11rem,auto)_minmax(8rem,auto)_minmax(18rem,1fr)]',
            'lg:items-center lg:gap-x-10',
          ].join(' ')}
        >
          <div>
            <p className="numeric font-serif text-[clamp(2.25rem,5vw,4rem)] leading-none text-gold">
              {formatCents(cents(totals.meterCents))}
            </p>

            <p className="mt-2 text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">
              {backed}
            </p>
          </div>

          <div>
            <p className="numeric font-serif text-[clamp(2.25rem,5vw,4rem)] leading-none text-[var(--text)]">
              <CountUp value={totals.supporterCount} />
            </p>

            <p className="mt-2 text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-[var(--text-dim)]">
              {supportersLabel}
            </p>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <FundingMeter percent={percent} />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <p className="text-[0.625rem] font-medium uppercase tracking-[0.16em] text-[var(--text-dim)]">
                {goalLabel}:{' '}
                <span className="numeric text-[var(--text)]">
                  {formatCents(cents(totals.goalCents))}
                </span>
              </p>

              <p className="text-[0.625rem] font-medium uppercase tracking-[0.16em] text-[var(--text-dim)]">
                {daysLeft !== null &&
                daysLeft > 0 &&
                isAcceptingSupport ? (
                  <>
                    <span className="numeric text-[var(--text)]">
                      {daysLeft}
                    </span>{' '}
                    {timeLabel}
                  </>
                ) : (
                  timeLabel
                )}
              </p>
            </div>
          </div>
        </div>

        {objective ? (
          <div className="mt-8 border-t border-[var(--line)] pt-7">
            <p className="max-w-[76ch] text-base leading-7 text-[var(--text-dim)]">
              {objective}
            </p>
          </div>
        ) : null}

        {sponsorNote ? (
          <p className="mt-4 max-w-[76ch] text-xs leading-5 text-[var(--text-faint)]">
            {sponsorNote}
          </p>
        ) : null}
      </div>
    </section>
  );
}
