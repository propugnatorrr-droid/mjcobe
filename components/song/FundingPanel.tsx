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
          amount: formatCents(
            cents(totals.sponsorCents),
          ),
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

  const percent = Math.min(
    100,
    Math.max(0, totals.percent),
  );

  return (
    <section
      id="campaign"
      aria-label={backed}
      className="song-funding"
    >
      <div className="site-shell song-funding-shell">
        <div className="song-funding-grid">
          <div className="song-funding-stat">
            <p className="song-funding-figure song-funding-figure--gold">
              {formatCents(
                cents(totals.meterCents),
              )}
            </p>

            <p className="song-funding-label">
              {backed}
            </p>
          </div>

          <div className="song-funding-stat">
            <p className="song-funding-figure">
              <CountUp
                value={totals.supporterCount}
              />
            </p>

            <p className="song-funding-label">
              {supportersLabel}
            </p>
          </div>

          <div className="song-meter-column">
            <FundingMeter percent={percent} />

            <div className="song-meter-meta">
              <p>
                {goalLabel}:{' '}
                <span>
                  {formatCents(
                    cents(totals.goalCents),
                  )}
                </span>
              </p>

              <p>
                {daysLeft !== null &&
                daysLeft > 0 &&
                isAcceptingSupport ? (
                  <>
                    <span>{daysLeft}</span>{' '}
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
          <p className="song-funding-objective">
            {objective}
          </p>
        ) : null}

        {sponsorNote ? (
          <p className="song-sponsor-note">
            {sponsorNote}
          </p>
        ) : null}
      </div>
    </section>
  );
}
