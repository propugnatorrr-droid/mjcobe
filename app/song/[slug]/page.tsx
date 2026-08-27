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
import { ButtonLink } from '@/components/primitives/Button';
import { getSongPage } from '@/lib/song/queries';
import { text } from '@/lib/copy/site-copy';
import { cents, formatCents } from '@/lib/money/cents';

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
    title: `${data.song.title} — ${await text('hero.artist_name')}`,
    description:
      data.song.description ?? (await text('hero.subcopy')),
  };
}

export default async function SongPage({ params }: Props) {
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

  const supportEnabled =
    data.isAcceptingSupport &&
    (campaign?.fanSupportEnabled ?? false);

  const sponsorEnabled =
    data.isAcceptingSupport &&
    (campaign?.businessSponsorshipEnabled ?? false);

  const showActions = supportEnabled || sponsorEnabled;

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
        'surface-ink min-h-screen',
        showActions ? 'pb-28 sm:pb-24' : '',
      ].join(' ')}
    >
      <SimulationRibbon />
      <SiteNav sub={navLabel} />

      <SongHero
        song={song}
        campaign={campaign}
        cover={cover}
        audio={audio}
      />

      <FundingPanel
        totals={totals}
        daysLeft={data.daysLeft}
        isAcceptingSupport={data.isAcceptingSupport}
        objective={campaign?.objective ?? null}
      />

      <section
        aria-label={supportLabel}
        className="site-shell pt-8 sm:pt-10"
      >
        {showActions ? (
          <div
            className={[
              'grid grid-cols-1 gap-3',
              supportEnabled && sponsorEnabled
                ? 'sm:grid-cols-2'
                : '',
            ].join(' ')}
          >
            {supportEnabled ? (
              <ButtonLink
                href={`/back?song=${song.slug}`}
                variant="primary"
                glow
                className="w-full !py-4"
              >
                {supportLabel}
              </ButtonLink>
            ) : null}

            {sponsorEnabled ? (
              <ButtonLink
                href={`/song/${song.slug}/sponsor`}
                variant="ghost"
                className="w-full !py-4"
              >
                {sponsorLabel}
              </ButtonLink>
            ) : null}
          </div>
        ) : (
          <div className="panel px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
              {closedNotice}
            </p>
          </div>
        )}
      </section>

      <div className="site-shell grid grid-cols-1 gap-x-10 lg:grid-cols-2">
        <LeaderboardPanel
          headingKey="song.section.supporters"
          emptyKey="song.empty.supporters"
          moreKey="leaderboard.more_supporters"
          rows={fan.rows}
          totalCount={fan.totalCount}
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

      <section className="site-shell py-12 sm:py-16">
        <div className="flex items-center gap-4 sm:gap-6">
          <span
            aria-hidden
            className="rule-gold h-px flex-1 opacity-40"
          />

          <p
            className={[
              'max-w-[44rem] text-balance text-center',
              'font-serif text-[clamp(1.2rem,3vw,2rem)] italic',
              'leading-relaxed text-[var(--text-dim)]',
            ].join(' ')}
          >
            {proofLine}
          </p>

          <span
            aria-hidden
            className="rule-gold h-px flex-1 opacity-40"
          />
        </div>

        <Crown
          aria-hidden
          size={19}
          strokeWidth={1.6}
          color="var(--champagne)"
          className="mx-auto mt-5"
        />
      </section>

      <div className="site-shell">
        {crown && sponsorEnabled ? (
          <CrownPanel
            crown={crown}
            songSlug={song.slug}
            isAcceptingSupport={sponsorEnabled}
          />
        ) : null}

        <TierGrid
          tiers={data.tiers}
          songSlug={song.slug}
          isAcceptingSupport={supportEnabled}
        />

        <UpdateList updates={data.updates} />

        <JourneyList journey={data.journey} />
      </div>

      <SiteFooter />

      {showActions ? (
        <SupportBar
          primaryLabel={primaryLabel}
          primaryHref={primaryHref}
          secondaryLabel={secondaryLabel}
          secondaryHref={secondaryHref}
          figure={formatCents(cents(totals.meterCents))}
          caption={proofLine}
        />
      ) : null}
    </main>
  );
}
