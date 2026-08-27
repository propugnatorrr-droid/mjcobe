import Link from 'next/link';
import { Lock } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { FundingMeter } from '@/components/primitives/FundingMeter';
import { ButtonLink } from '@/components/primitives/Button';
import { AudioPreview } from '@/components/song/AudioPreview';
import { listCatalog, type CatalogSong } from '@/lib/catalog/queries';
import { text } from '@/lib/copy/site-copy';

export const revalidate = 60;

async function SongCard({ song, cta }: { song: CatalogSong; cta: string }) {
  const comingSoonLabel = await text('song.preview_coming_soon');

  return (
    <div
      className="group flex flex-col gap-4 rounded-[var(--radius-panel)] border p-4 transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--champagne)]"
      style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
    >
      <Link href={`/song/${song.slug}`} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]">
        {song.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={song.coverPath}
            alt=""
            width={320}
            height={320}
            className="aspect-square w-full rounded-[var(--radius-panel)] object-cover"
            style={{ backgroundColor: 'var(--ink)' }}
          />
        ) : (
          <div
            className="aspect-square w-full rounded-[var(--radius-panel)]"
            style={{ background: 'var(--ink)' }}
          />
        )}
      </Link>
      <div>
        <Link href={`/song/${song.slug}`}>
          <h3 className="font-display text-2xl text-[var(--text)] group-hover:text-[var(--champagne)]">
            {song.title}
          </h3>
        </Link>

        <div className="mt-3">
          <AudioPreview
            src={song.audioPath}
            previewStartMs={song.previewStartMs}
            previewEndMs={song.previewEndMs}
            comingSoonLabel={comingSoonLabel}
          />
        </div>

        {song.goalCents > 0 ? (
          <div className="mt-3">
            <FundingMeter percent={song.percent} />
          </div>
        ) : null}
        <Link
          href={`/song/${song.slug}`}
          className="mt-3 block font-mono text-eyebrow uppercase text-[var(--champagne)] hover:underline"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

function VaultCard({ song }: { song: CatalogSong }) {
  return (
    <div
      className="flex flex-col gap-4 rounded-[var(--radius-panel)] border p-4"
      style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
    >
      <div
        className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-panel)]"
        style={{ background: 'var(--ink)' }}
      >
        {song.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={song.coverPath}
            alt=""
            width={320}
            height={320}
            className="h-full w-full object-cover opacity-40"
          />
        ) : null}
        <Lock
          aria-hidden
          size={28}
          color="var(--champagne)"
          className="absolute inset-0 m-auto"
        />
      </div>
      <h3 className="font-display text-2xl text-[var(--text-dim)]">{song.title}</h3>
    </div>
  );
}

export default async function MusicPage() {
  const [catalog, title, releasedLabel, releasedSub, comingSoonLabel, comingSoonSub,
    buildingLabel, buildingSub, vaultLabel, joinJourney, empty, listenCta, backCta] =
    await Promise.all([
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
      text('home.listen'),
      text('nav.cta'),
    ]);

  const released = catalog.filter((s) => s.status === 'released');
  const comingSoon = catalog.filter((s) => s.status === 'coming_soon');
  const building = catalog.filter((s) => s.status === 'building');
  const vault = catalog.filter((s) => s.status === 'vault');

  const sections: { heading: string; sub: string; songs: CatalogSong[]; cta: string }[] = [
    { heading: buildingLabel, sub: buildingSub, songs: building, cta: backCta },
    { heading: comingSoonLabel, sub: comingSoonSub, songs: comingSoon, cta: listenCta },
    { heading: releasedLabel, sub: releasedSub, songs: released, cta: listenCta },
  ];

  return (
    <main className="surface-ink min-h-screen">
      <SiteNav />

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
        <h1 className="font-display text-display text-[var(--text)]">{title}</h1>
      </section>

      {sections.map((section) =>
        section.songs.length > 0 ? (
          <section key={section.heading} className="mx-auto max-w-6xl px-6 pb-16 md:px-12 md:pb-24">
            <Eyebrow>{section.heading}</Eyebrow>
            <p className="mt-2 text-body text-[var(--text-dim)]">{section.sub}</p>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {section.songs.map((song) => (
                <SongCard key={song.id} song={song} cta={section.cta} />
              ))}
            </div>
          </section>
        ) : null,
      )}

      {vault.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 pb-16 md:px-12 md:pb-24">
          <Eyebrow>{vaultLabel}</Eyebrow>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vault.map((song) => (
              <VaultCard key={song.id} song={song} />
            ))}
          </div>
        </section>
      ) : null}

      {catalog.length === 0 ? (
        <p className="mx-auto max-w-6xl px-6 pb-24 text-body text-[var(--text-dim)] md:px-12">
          {empty}
        </p>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-12">
        <ButtonLink href="/journey" variant="ghost">
          {joinJourney}
        </ButtonLink>
      </section>
    </main>
  );
}
