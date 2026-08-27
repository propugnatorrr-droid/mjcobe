import type { Metadata } from 'next';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileCta } from '@/components/MobileCta';
import { HomeHero } from '@/components/home/HomeHero';
import { FeaturedCampaign } from '@/components/home/FeaturedCampaign';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { getLookbookImage } from '@/lib/lookbook/manifest';
import { listCatalog } from '@/lib/catalog/queries';
import { getLeaderboard } from '@/lib/campaign/queries';
import { text } from '@/lib/copy/site-copy';

export const metadata: Metadata = {
  title: 'Soul Has A New Face.',
  description:
    'Original R&B. A new visual world. A career being built in real time.',
};

export const revalidate = 60;

export default async function HomePage() {
  const [hero, catalog] = await Promise.all([
    Promise.resolve(getLookbookImage('hero')),
    listCatalog(),
  ]);

  const featured = catalog.find((song) => song.status === 'building') ?? null;

  const [fanLeaderboard, sponsorLeaderboard] = featured?.campaignId
    ? await Promise.all([
        getLeaderboard(featured.campaignId, 'fan', 1),
        getLeaderboard(featured.campaignId, 'business', 1),
      ])
    : [null, null];

  const [
    artistName,
    tagline,
    subcopy,
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
  ] = await Promise.all([
    text('hero.artist_name'),
    text('hero.tagline'),
    text('hero.subcopy'),
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
  ]);

  return (
    <main
      id="main-content"
      className="surface-ink min-h-screen"
    >
      <SiteNav />

      <HomeHero
        image={hero}
        artistName={artistName}
        tagline={tagline}
        subcopy={subcopy}
        listenLabel={listenLabel}
        ctaLabel={ctaLabel}
      />

      {featured ? (
        <FeaturedCampaign
          song={featured}
          topFan={fanLeaderboard?.rows[0] ?? null}
          topSponsor={sponsorLeaderboard?.rows[0] ?? null}
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
        <section className="section-space-compact">
          <div className="site-shell">
            <SectionHeading>{currentlyBuilding}</SectionHeading>

            <div className="panel mt-7 p-8 sm:p-10">
              <p className="max-w-[52ch] text-base leading-7 text-[var(--text-dim)]">
                {emptyLabel}
              </p>
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
      <MobileCta />
    </main>
  );
}
