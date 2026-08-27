import { Crown, Trophy } from 'lucide-react';
import { ButtonLink } from '@/components/primitives/Button';

type SponsorChallengeProps = {
  songSlug: string;
  leaderName?: string | null;
  leaderAmount?: string | null;
  minimumAmount: string;
  heading: string;
  currentLabel: string;
  minimumLabel: string;
  openLabel: string;
  body: string;
  actionLabel: string;
};

export function SponsorChallenge({
  songSlug,
  leaderName,
  leaderAmount,
  minimumAmount,
  heading,
  currentLabel,
  minimumLabel,
  openLabel,
  body,
  actionLabel,
}: SponsorChallengeProps) {
  return (
    <section
      aria-labelledby="sponsor-challenge-heading"
      className={[
        'relative overflow-hidden',
        'rounded-[var(--radius-panel)]',
        'border border-[rgba(201,162,39,0.52)]',
        'bg-[var(--ink-2)] p-6 sm:p-8 lg:p-10',
      ].join(' ')}
      style={{
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.05) inset, 0 24px 70px rgba(0,0,0,0.32)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px rule-gold"
      />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="max-w-2xl">
          <span
            className={[
              'inline-flex h-11 w-11 items-center justify-center',
              'rounded-full border border-[rgba(201,162,39,0.5)]',
              'bg-[rgba(201,162,39,0.08)]',
            ].join(' ')}
          >
            <Trophy
              aria-hidden
              size={19}
              strokeWidth={1.6}
              color="var(--champagne)"
            />
          </span>

          <p className="mt-5 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-[var(--champagne)]">
            {heading}
          </p>

          {leaderName && leaderAmount ? (
            <div className="mt-4">
              <p className="font-ui text-[0.625rem] uppercase tracking-[0.18em] text-[var(--text-dim)]">
                {currentLabel}
              </p>

              <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <h2
                  id="sponsor-challenge-heading"
                  className="font-serif text-2xl leading-tight text-[var(--text)] sm:text-3xl"
                >
                  {leaderName}
                </h2>

                <span className="numeric font-serif text-2xl text-gold sm:text-3xl">
                  {leaderAmount}
                </span>
              </div>
            </div>
          ) : (
            <h2
              id="sponsor-challenge-heading"
              className="mt-4 font-serif text-2xl text-[var(--text)] sm:text-3xl"
            >
              {openLabel}
            </h2>
          )}

          <p className="mt-5 max-w-[58ch] text-sm leading-6 text-[var(--text-dim)] sm:text-base">
            {body}
          </p>
        </div>

        <div
          className={[
            'min-w-0 rounded-[var(--radius-panel)]',
            'border border-[var(--line)]',
            'bg-[var(--ink)] p-5 sm:min-w-64 sm:p-6',
          ].join(' ')}
        >
          <div className="flex items-center gap-2">
            <Crown
              aria-hidden
              size={15}
              strokeWidth={1.7}
              color="var(--champagne)"
            />

            <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
              {minimumLabel}
            </p>
          </div>

          <p className="numeric mt-3 font-serif text-4xl leading-none text-gold">
            {minimumAmount}
          </p>

          <ButtonLink
            href={`/song/${songSlug}/sponsor?claim=1`}
            glow
            className="mt-6 w-full"
          >
            {actionLabel}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
