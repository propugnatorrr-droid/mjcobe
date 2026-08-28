import Link from 'next/link';
import {
  ArrowUpRight,
  Crown,
  Heart,
  Users,
} from 'lucide-react';
import { CampaignLeader } from '@/components/home/CampaignLeader';
import { ButtonLink } from '@/components/primitives/Button';
import { FundingMeter } from '@/components/primitives/FundingMeter';
import { SectionHeading } from '@/components/primitives/SectionHeading';
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
  const percent = Math.min(
    100,
    Math.max(0, song.percent),
  );

  return (
    <section
      aria-labelledby="currently-building-heading"
      className="home-campaign-section"
    >
      <div className="site-shell">
        <div id="currently-building-heading">
          <SectionHeading sub={copy.newSingle}>
            {copy.sectionHeading}
          </SectionHeading>
        </div>

        <article className="home-campaign">
          <Link
            href={songHref}
            aria-label={song.title}
            className="home-campaign-art-link"
          >
            {song.coverPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={song.coverPath}
                alt=""
                width={800}
                height={800}
                loading="lazy"
                className="home-campaign-art"
              />
            ) : (
              <span
                aria-hidden
                className="home-campaign-art-placeholder"
              />
            )}

            <span
              aria-hidden
              className="home-campaign-art-treatment"
            />

            <span className="home-campaign-art-label">
              {copy.newSingle}
            </span>

            <span
              aria-hidden
              className="home-campaign-art-action"
            >
              <ArrowUpRight
                size={19}
                strokeWidth={1.7}
              />
            </span>
          </Link>

          <div className="home-campaign-content">
            <div>
              <p className="home-campaign-kicker">
                {copy.sectionHeading}
              </p>

              <h2 className="home-campaign-title">
                <Link href={songHref}>
                  {song.title}
                </Link>
              </h2>

              {song.description ? (
                <p className="home-campaign-description">
                  {song.description}
                </p>
              ) : null}
            </div>

            <div className="home-campaign-progress">
              <div className="home-campaign-progress-heading">
                <span>{copy.raisedToward}</span>

                <span className="numeric">
                  {formatCents(cents(song.goalCents))}
                </span>
              </div>

              <FundingMeter percent={percent} />

              <div className="home-campaign-stat-grid">
                <div>
                  <p className="home-campaign-stat-value text-gold">
                    {formatCents(cents(song.raisedCents))}
                  </p>

                  <p className="home-campaign-stat-label">
                    {copy.raisedToward}
                  </p>
                </div>

                <div>
                  <p className="home-campaign-stat-value">
                    <Users
                      aria-hidden
                      size={20}
                      strokeWidth={1.6}
                    />

                    <span className="numeric">
                      {song.supporterCount}
                    </span>
                  </p>

                  <p className="home-campaign-stat-label">
                    {copy.supporters}
                  </p>
                </div>
              </div>
            </div>

            <ButtonLink
              href={songHref}
              variant="ghost"
              className="w-full sm:w-fit"
            >
              {copy.viewProject}

              <ArrowUpRight
                aria-hidden
                size={16}
                strokeWidth={1.8}
              />
            </ButtonLink>
          </div>

          {topFan || topSponsor ? (
            <aside className="home-campaign-leaders">
              {topFan ? (
                <CampaignLeader
                  label={copy.topFan}
                  row={topFan}
                  anonymousLabel={copy.anonymous}
                  hiddenAmountLabel={copy.hiddenAmount}
                  icon={Heart}
                />
              ) : null}

              {topSponsor ? (
                <CampaignLeader
                  label={copy.topSponsor}
                  row={topSponsor}
                  anonymousLabel={copy.anonymous}
                  hiddenAmountLabel={copy.hiddenAmount}
                  icon={Crown}
                  featured
                  logo
                />
              ) : null}
            </aside>
          ) : null}
        </article>
      </div>
    </section>
  );
}
