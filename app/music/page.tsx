import type { Metadata } from 'next';
import { CatalogSection } from '@/components/catalog/CatalogSection';
import { CatalogVaultCard } from '@/components/catalog/CatalogVaultCard';
import { MusicHero } from '@/components/catalog/MusicHero';
import { MobileCta } from '@/components/MobileCta';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteNav } from '@/components/SiteNav';
import { listCatalog } from '@/lib/catalog/queries';
import { text } from '@/lib/copy/site-copy';

export const metadata: Metadata = {
  title: 'Music',
  description:
    'Explore released records, upcoming music and songs currently being built with MJ COBE supporters.',
};

export const revalidate = 60;

export default async function MusicPage() {
  const [
    catalog,
    title,
    eyebrow,
    intro,
    releasedLabel,
    releasedSub,
    comingSoonLabel,
    comingSoonSub,
    buildingLabel,
    buildingSub,
    vaultLabel,
    joinJourney,
    emptyLabel,
    supportersLabel,
    previewComingSoon,
    playPreview,
    pausePreview,
    seekPreview,
  ] = await Promise.all([
    listCatalog(),
    text('music.title'),
    text('music.eyebrow'),
    text('music.intro'),
    text('music.released'),
    text('music.released_sub'),
    text('music.coming_soon'),
    text('music.coming_soon_sub'),
    text('music.building_now'),
    text('music.building_now_sub'),
    text('music.vault'),
    text('music.join_the_journey'),
    text('music.empty_section'),
    text('home.supporters'),
    text('song.preview_coming_soon'),
    text('music.audio.play'),
    text('music.audio.pause'),
    text('music.audio.seek'),
  ]);


  const released = catalog.filter(
    (song) => song.status === 'released',
  );

  const comingSoon = catalog.filter(
    (song) => song.status === 'coming_soon',
  );

  const building = catalog.filter(
    (song) => song.status === 'building',
  );

  const vault = catalog.filter(
    (song) => song.status === 'vault',
  );

  return (
    <main
      id="main-content"
      className="surface-ink min-h-screen"
    >
      <SiteNav sub={title} />

      <MusicHero
        title={title}
        eyebrow={eyebrow}
        intro={intro}
        recordCount={catalog.length}
      />

      <div className="site-shell music-catalog">
        <CatalogSection
          heading={buildingLabel}
          subheading={buildingSub}
          songs={building}
          featured
          labels={{
            status: buildingLabel,
            supporters: supportersLabel,
            joinJourney,
            previewComingSoon,
            playPreview,
            pausePreview,
            seekPreview,
          }}
        />

        <CatalogSection
          heading={releasedLabel}
          subheading={releasedSub}
          songs={released}
          labels={{
            status: releasedLabel,
            supporters: supportersLabel,
            joinJourney,
            previewComingSoon,
            playPreview,
            pausePreview,
            seekPreview,
          }}
        />

        <CatalogSection
          heading={comingSoonLabel}
          subheading={comingSoonSub}
          songs={comingSoon}
          labels={{
            status: comingSoonLabel,
            supporters: supportersLabel,
            joinJourney,
            previewComingSoon,
            playPreview,
            pausePreview,
            seekPreview,
          }}
        />

        {vault.length > 0 ? (
          <section
            aria-labelledby="catalog-vault"
            className="music-catalog-section"
          >
            <div id="catalog-vault">
              <SectionHeading>
                {vaultLabel}
              </SectionHeading>
            </div>

            <div className="music-catalog-grid">
              {vault.map((song) => (
                <CatalogVaultCard
                  key={song.id}
                  song={song}
                  label={vaultLabel}
                />
              ))}
            </div>
          </section>
        ) : null}

        {catalog.length === 0 ? (
          <section className="music-empty">
            <p>{emptyLabel}</p>
          </section>
        ) : null}
      </div>

      <SiteFooter />
      <MobileCta />
    </main>
  );
}
