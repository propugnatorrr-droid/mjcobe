import type { Metadata } from 'next';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileCta } from '@/components/MobileCta';
import { CatalogSection } from '@/components/catalog/CatalogSection';
import { CatalogVaultCard } from '@/components/catalog/CatalogVaultCard';
import { SectionHeading } from '@/components/primitives/SectionHeading';
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
  ] = await Promise.all([
    listCatalog(),
    text('music.title'),
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

      <div className="site-shell py-10 sm:py-12 lg:py-16">
        <h1 className="sr-only">{title}</h1>

        <div className="space-y-16 lg:space-y-20">
          <CatalogSection
            heading={releasedLabel}
            subheading={releasedSub}
            songs={released}
            labels={{
              status: releasedLabel,
              supporters: supportersLabel,
              joinJourney,
              previewComingSoon,
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
            }}
          />

          <CatalogSection
            heading={buildingLabel}
            subheading={buildingSub}
            songs={building}
            labels={{
              status: buildingLabel,
              supporters: supportersLabel,
              joinJourney,
              previewComingSoon,
            }}
          />

          {vault.length > 0 ? (
            <section aria-labelledby="catalog-vault">
              <div id="catalog-vault">
                <SectionHeading>{vaultLabel}</SectionHeading>
              </div>

              <div className="catalog-grid mt-7">
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
            <section className="panel p-8 sm:p-10">
              <p className="max-w-[52ch] text-base leading-7 text-[var(--text-dim)]">
                {emptyLabel}
              </p>
            </section>
          ) : null}
        </div>
      </div>

      <SiteFooter />
      <MobileCta />
    </main>
  );
}
