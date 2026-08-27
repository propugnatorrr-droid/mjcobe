import Link from 'next/link';
import { ArrowRight, Crown, Heart, Users } from 'lucide-react';
import { ButtonLink } from '@/components/primitives/Button';
import { FundingMeter } from '@/components/primitives/FundingMeter';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { SpotlightRow } from '@/components/home/SpotlightRow';
import type { CatalogSong } from '@/lib/catalog/queries';
import type { LeaderboardRowData } from '@/lib/campaign/queries';
import { cents, formatCents } from '@/lib/money/cents';

type FeaturedCampaignProps = {
  song: CatalogSong;
  topFan: LeaderboardRowData | null;
  topSponsor: LeaderboardRowData | null;
  copy: {
    sectionHeading: string;
    newSingle: string;
    viewProject: string;
    supporters: string;
    raisedToward: string;
    topFan: string;
    topSponsor: string;
    anonymous: string;
    hiddenAmount: string;
  };
};

export function FeaturedCampaign({
  song,
  topFan,
  topSponsor,
  copy,
}: FeaturedCampaignProps) {
  const songHref = `/song/${song.slug}`;
  const percent = Math.min(100, Math.max(0, song.percent));

  return (
    <section
      aria-labelledby="currently-building-heading"
      className="section-space-compact"
    >
      <div className="site-shell">
        <div id="currently-building-heading">
          <SectionHeading>{copy.sectionHeading}</SectionHeading>
        </div>

        <article
          className={[
            'panel mt-7 overflow-hidden',
            'grid grid-cols-1',
            'lg:grid-cols-[minmax(15rem,19rem)_minmax(0,1fr)_minmax(15rem,18rem)]',
          ].join(' ')}
        >
          <Link
            href={songHref}
            aria-label={song.title}
            className={[
              'group relative block overflow-hidden',
              'border-b border-[var(--line)]',
              'lg:border-b-0 lg:border-r',
            ].join(' ')}
          >
            {song.coverPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={song.coverPath}
                alt=""
                width={608}
                height={608}
                className={[
                  'aspect-square h-full w-full object-cover',
                  'transition-[filter,transform]',
                  '[transition-duration:var(--duration-signature)]',
                  '[transition-timing-function:var(--ease-signature)]',
                  'group-hover:brightness-110',
                ].join(' ')}
                style={{
                  backgroundColor: 'var(--ink)',
                }}
              />
            ) : (
              <span
                aria-hidden
                className="block aspect-square h-full w-full bg-[var(--ink)]"
              />
            )}

            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 border border-transparent transition-colors group-hover:border-[rgba(201,162,39,0.45)]"
            />
          </Link>

          <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10">
            <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-[var(--champagne)]">
              {copy.newSingle}
            </p>

            <h3
              className={[
                'mt-3 max-w-[16ch]',
                'font-serif text-[clamp(2rem,4.2vw,4rem)]',
                'leading-[0.98] tracking-[-0.02em]',
                'text-[var(--text)]',
              ].join(' ')}
            >
              <Link
                href={songHref}
                className="transition-colors hover:text-[var(--champagne)]"
              >
                {song.title}
              </Link>
            </h3>

            {song.description ? (
              <p className="mt-5 max-w-[52ch] text-sm leading-6 text-[var(--text-dim)] sm:text-base sm:leading-7">
                {song.description}
              </p>
            ) : null}

            <div className="mt-8">
              <FundingMeter percent={percent} />
            </div>

            <div className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
              <div>
                <p className="numeric font-serif text-3xl leading-none text-gold sm:text-4xl">
                  {formatCents(cents(song.raisedCents))}
                </p>

                <p className="mt-2 text-xs leading-5 text-[var(--text-dim)]">
                  {copy.raisedToward}{' '}
                  <span className="numeric text-[var(--text)]">
                    {formatCents(cents(song.goalCents))}
                  </span>
                </p>
              </div>

              <div>
                <p className="flex items-center gap-2.5">
                  <Users
                    aria-hidden
                    size={18}
                    strokeWidth={1.7}
                    color="var(--champagne)"
                  />

                  <span className="numeric font-serif text-3xl leading-none text-[var(--text)]">
                    {song.supporterCount}
                  </span>
                </p>

                <p className="mt-2 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  {copy.supporters}
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-[var(--line)] pt-6">
              <ButtonLink
                href={songHref}
                variant="ghost"
                className="w-full sm:w-auto"
              >
                {copy.viewProject}
                <ArrowRight aria-hidden size={15} />
              </ButtonLink>
            </div>
          </div>

          <aside
            aria-label={`${copy.topFan} / ${copy.topSponsor}`}
            className={[
              'flex flex-col justify-center gap-7',
              'border-t border-[var(--line)] p-6',
              'sm:p-8',
              'lg:border-l lg:border-t-0',
            ].join(' ')}
          >
            {topFan ? (
              <SpotlightRow
                label={copy.topFan}
                row={topFan}
                anonymousLabel={copy.anonymous}
                hiddenAmountLabel={copy.hiddenAmount}
                icon={Heart}
              />
            ) : null}

            {topFan && topSponsor ? (
              <div aria-hidden className="h-px bg-[var(--line)]" />
            ) : null}

            {topSponsor ? (
              <div
                className={[
                  'rounded-[var(--radius-panel)]',
                  'border border-[rgba(201,162,39,0.28)]',
                  'bg-[rgba(201,162,39,0.035)] p-4',
                ].join(' ')}
                style={{
                  boxShadow: '0 0 24px rgba(201, 162, 39, 0.08)',
                }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <Crown
                    aria-hidden
                    size={15}
                    strokeWidth={1.8}
                    color="var(--champagne)"
                  />
                  <span className="numeric text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-[var(--champagne)]">
                    #1
                  </span>
                </div>

                <SpotlightRow
                  label={copy.topSponsor}
                  row={topSponsor}
                  anonymousLabel={copy.anonymous}
                  hiddenAmountLabel={copy.hiddenAmount}
                  icon={Crown}
                  logo
                />
              </div>
            ) : null}
          </aside>
        </article>

        <div className="mt-8 flex items-center justify-center gap-3 text-center">
          <span
            aria-hidden
            className="h-px w-8 bg-[var(--champagne)] opacity-60"
          />
          <p className="font-serif text-base italic text-[var(--text-dim)] sm:text-lg">
            {song.supporterCount}{' '}
            {copy.supporters.toLowerCase()}
          </p>
          <span
            aria-hidden
            className="h-px w-8 bg-[var(--champagne)] opacity-60"
          />
        </div>
      </div>
    </section>
  );
}
