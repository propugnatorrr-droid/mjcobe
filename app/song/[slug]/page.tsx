import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Crown } from 'lucide-react';
import { SimulationRibbon } from '@/components/SimulationRibbon';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { SongHero } from '@/components/song/SongHero';
import { FundingPanel } from '@/components/song/FundingPanel';
import { CrownPanel } from '@/components/song/CrownPanel';
import { LeaderboardPanel } from '@/components/song/LeaderboardPanel';
import { TierGrid } from '@/components/song/TierGrid';
import { UpdateList } from '@/components/song/UpdateList';
import { JourneyList } from '@/components/song/JourneyList';
import { SupportBar } from '@/components/song/SupportBar';
import { ReleaseLinks } from '@/components/song/ReleaseLinks';
import { ButtonLink } from '@/components/primitives/Button';
import {
  AnalyticsEvent,
} from '@/components/analytics/AnalyticsEvent';
import { getSongPage } from '@/lib/song/queries';
import {
  supporterAccessForCampaign,
} from '@/lib/supporter/access';
import { text } from '@/lib/copy/site-copy';
import {
  cents,
  formatCents,
} from '@/lib/money/cents';

export const revalidate = 60;

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSongPage(slug);

  if (!data) {
    return {
      title: await text('notfound.title'),
    };
  }

  return {
    title: `${data.song.title} — ${await text(
      'hero.artist_name',
    )}`,
    description:
      data.song.description ??
      (await text('hero.subcopy')),
  };
}

export default async function SongPage({
  params,
}: Props) {
  const { slug } = await params;
  const data = await getSongPage(slug);

  if (!data) {
    notFound();
  }

  const {
    song,
    campaign,
    cover,
    audio,
    totals,
    fan,
    business,
    crown,
  } = data;

  const unlockedUpdateCents = campaign
    ? await supporterAccessForCampaign(
        campaign.id,
      )
    : 0;

  const supportEnabled =
    data.isAcceptingSupport &&
    (campaign?.fanSupportEnabled ?? false);

  const sponsorEnabled =
    data.isAcceptingSupport &&
    (campaign?.businessSponsorshipEnabled ??
      false);

  const showActions =
    supportEnabled || sponsorEnabled;

  const [
    navLabel,
    supportLabel,
    sponsorLabel,
    closedNotice,
    proofLine,
  ] = await Promise.all([
    text('song.nav_label'),
    text('button.back_this_song'),
    text('button.sponsor_this_song'),
    text('song.closed.notice'),
    totals.supporterCount > 0
      ? text('song.proof_line', {
          count: totals.supporterCount,
        })
      : text('song.proof_line_empty'),
  ]);

  const primaryLabel = supportEnabled
    ? supportLabel
    : sponsorLabel;

  const primaryHref = supportEnabled
    ? `/back?song=${song.slug}`
    : `/song/${song.slug}/sponsor`;

  const secondaryLabel =
    supportEnabled && sponsorEnabled
      ? sponsorLabel
      : undefined;

  const secondaryHref =
    supportEnabled && sponsorEnabled
      ? `/song/${song.slug}/sponsor`
      : undefined;

  return (
    <main
      id="main-content"
      className={[
        'surface-ink song-page',
        showActions ? 'pb-28 sm:pb-24' : '',
      ].join(' ')}
    >
      <SimulationRibbon />
      <SiteNav sub={navLabel} />

      <AnalyticsEvent
        kind="song_page_view"
        songId={song.id}
        campaignId={
          campaign?.id
        }
        watchClicks
      />

      <SongHero

        song={song}
        campaign={campaign}
        cover={cover}
        audio={audio}
      />

      <FundingPanel
        totals={totals}
        daysLeft={data.daysLeft}
        isAcceptingSupport={
          data.isAcceptingSupport
        }
        objective={
          campaign?.objective ??
          song.description
        }
      />

      <section
        aria-label={supportLabel}
        className="site-shell song-action-band"
      >
        {showActions ? (
          <div
            className={[
              'song-actions',
              supportEnabled && sponsorEnabled
                ? ''
                : 'song-actions--single',
            ].join(' ')}
          >
            {supportEnabled ? (
              <ButtonLink
                href={`/back?song=${song.slug}`}
                variant="primary"
                glow
                data-analytics-kind="support_click"
                data-analytics-source="song_action_band"
              >

                {supportLabel}
              </ButtonLink>
            ) : null}

            {sponsorEnabled ? (
              <ButtonLink
                href={`/song/${song.slug}/sponsor`}
                variant="ghost"
                data-analytics-kind="sponsor_click"
                data-analytics-source="song_action_band"
              >

                {sponsorLabel}
              </ButtonLink>
            ) : null}
          </div>
        ) : (
          <p className="song-closed">
            {closedNotice}
          </p>
        )}
      </section>

      <ReleaseLinks song={song} />

      <div className="site-shell song-leaderboards">

        <LeaderboardPanel
          headingKey="song.section.supporters"
          emptyKey="song.empty.supporters"
          moreKey="leaderboard.more_supporters"
          rows={fan.rows}
          totalCount={fan.totalCount}
          linkPrefix="/supporter"
          moreHref={`/song/${song.slug}/supporters`}
        />


        <LeaderboardPanel
          headingKey="leaderboard.business_heading"
          emptyKey="song.empty.partners"
          moreKey="song.partners.more"
          rows={business.rows}
          totalCount={business.totalCount}
          linkPrefix="/partner"
          moreHref={`/song/${song.slug}/sponsors`}
        />
      </div>

      <section className="site-shell song-proof">
        <div className="song-proof-inner">
          <span
            aria-hidden
            className="song-proof-rule"
          />

          <p className="song-proof-copy">
            {proofLine}
          </p>

          <span
            aria-hidden
            className="song-proof-rule"
          />
        </div>

        <span
          aria-hidden
          className="song-proof-icon"
        >
          <Crown
            size={19}
            strokeWidth={1.6}
          />
        </span>
      </section>

      <div className="site-shell song-content">
        {crown && sponsorEnabled ? (
          <CrownPanel
            crown={crown}
            songSlug={song.slug}
            isAcceptingSupport={
              sponsorEnabled
            }
          />
        ) : null}

        <TierGrid
          tiers={data.tiers}
          songSlug={song.slug}
          isAcceptingSupport={
            supportEnabled
          }
        />

        <UpdateList
          updates={data.updates}
          unlockedAmountCents={
            unlockedUpdateCents
          }
        />

        <JourneyList
          journey={data.journey}
        />
      </div>

      <SiteFooter />

      {showActions ? (
        <SupportBar
          primaryLabel={primaryLabel}
          primaryHref={primaryHref}
          secondaryLabel={secondaryLabel}
          secondaryHref={secondaryHref}
          figure={formatCents(
            cents(totals.meterCents),
          )}
          caption={proofLine}
        />
      ) : null}
    </main>
  );
}
