import type { Metadata } from 'next';
import { FeaturedCampaign } from '@/components/home/FeaturedCampaign';
import { HomeCatalogRow } from '@/components/home/HomeCatalogRow';
import { HomeFinalCta } from '@/components/home/HomeFinalCta';
import { HomeHero } from '@/components/home/HomeHero';
import { JourneySpotlight } from '@/components/home/JourneySpotlight';
import { PartnerStrip } from '@/components/home/PartnerStrip';
import { MobileCta } from '@/components/MobileCta';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteNav } from '@/components/SiteNav';
import { getHomeComposition } from '@/lib/home/queries';
import { formatDay } from '@/lib/song/queries';
import { text } from '@/lib/copy/site-copy';
import type { CopyKey } from '@/lib/copy/defaults';

export const metadata: Metadata = {
  title: 'Soul Has A New Face.',
  description:
    'Original R&B. A new visual world. A career being built in real time.',
};

export const revalidate = 60;

export default async function HomePage() {
  const home = await getHomeComposition();

  const [
    artistName,
    eyebrow,
    tagline,
    subcopy,
    heroAlt,
    listenLabel,
    ctaLabel,
    currentlyBuilding,
    newSingle,
    viewProject,
    supportersLabel,
    raisedToward,
    topFanHeading,
    topSponsorHeading,
    emptyLabel,
    anonymousLabel,
    hiddenAmountLabel,
    moreBuildingHeading,
    releasedHeading,
    viewAllMusic,
    joinJourney,
    previewComingSoon,
    playPreview,
    pausePreview,
    seekPreview,
    buildingStatusLabel,
    releasedStatusLabel,
    journeyHeading,
    journeyCta,
    partnersHeading,
    partnersCta,
    finalCtaHeading,
    finalCtaSub,
  ] = await Promise.all([
    text('hero.artist_name'),
    text('hero.eyebrow'),
    text('hero.tagline'),
    text('hero.subcopy'),
    text('lookbook.hero_alt'),
    text('home.listen'),
    text('nav.cta'),
    text('home.currently_building'),
    text('home.new_single'),
    text('home.view_project'),
    text('home.supporters'),
    text('home.raised_toward'),
    text('home.top_fan_heading'),
    text('home.top_sponsor_heading'),
    text('home.empty'),
    text('song.anonymous'),
    text('song.amount_hidden'),
    text('home.more_building_heading'),
    text('music.released'),
    text('home.view_all_music'),
    text('music.join_the_journey'),
    text('song.preview_coming_soon'),
    text('music.audio.play'),
    text('music.audio.pause'),
    text('music.audio.seek'),
    text('music.building_now'),
    text('music.released'),
    text('home.journey_heading'),
    text('home.journey_cta'),
    text('home.partners_heading'),
    text('home.partners_cta'),
    text('home.final_cta_heading'),
    text('home.final_cta_sub'),
  ]);

  const catalogLabels = {
    supporters: supportersLabel,
    joinJourney,
    previewComingSoon,
    playPreview,
    pausePreview,
    seekPreview,
  };

  const [journeyDay, journeyKindLabel] = home.latestJourney
    ? await Promise.all([
        formatDay(home.latestJourney.occurredAt),
        text(`journey.kind.${home.latestJourney.kind}` as CopyKey),
      ])
    : [null, null];

  return (
    <main
      id="main-content"
      className="surface-ink min-h-screen"
    >
      <SiteNav />

      <HomeHero
        imageAlt={heroAlt}
        eyebrow={eyebrow}
        artistName={artistName}
        tagline={tagline}
        subcopy={subcopy}
        listenLabel={listenLabel}
        ctaLabel={ctaLabel}
      />

      {home.featured ? (
        <FeaturedCampaign
          song={home.featured}
          topFan={home.topFan}
          topSponsor={home.topSponsor}
          copy={{
            sectionHeading: currentlyBuilding,
            newSingle,
            viewProject,
            supporters: supportersLabel,
            raisedToward,
            topFan: topFanHeading,
            topSponsor: topSponsorHeading,
            anonymous: anonymousLabel,
            hiddenAmount: hiddenAmountLabel,
          }}
        />
      ) : (
        <section className="home-campaign-section">
          <div className="site-shell">
            <SectionHeading>
              {currentlyBuilding}
            </SectionHeading>

            <div className="panel home-empty-panel">
              <p className="max-w-[52ch] text-base leading-7 text-[var(--text-dim)]">
                {emptyLabel}
              </p>
            </div>
          </div>
        </section>
      )}

      <HomeCatalogRow
        id="home-more-building-heading"
        heading={moreBuildingHeading}
        songs={home.buildingSongs}
        labels={{ ...catalogLabels, status: buildingStatusLabel }}
        viewAllHref="/music"
        viewAllLabel={viewAllMusic}
      />

      <HomeCatalogRow
        id="home-released-heading"
        heading={releasedHeading}
        songs={home.releasedSongs}
        labels={{ ...catalogLabels, status: releasedStatusLabel }}
        viewAllHref="/music"
        viewAllLabel={viewAllMusic}
      />

      {home.latestJourney && journeyDay && journeyKindLabel ? (
        <JourneySpotlight
          entry={home.latestJourney}
          heading={journeyHeading}
          day={journeyDay}
          kindLabel={journeyKindLabel}
          cta={journeyCta}
        />
      ) : null}

      <PartnerStrip
        partners={home.partners}
        heading={partnersHeading}
        cta={partnersCta}
      />

      <HomeFinalCta
        heading={finalCtaHeading}
        sub={finalCtaSub}
        ctaLabel={ctaLabel}
      />

      <SiteFooter />
      <MobileCta />
    </main>
  );
}
