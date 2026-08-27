import Link from 'next/link';
import { Users, Lock } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileCta } from '@/components/MobileCta';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { StatusBadge } from '@/components/primitives/StatusBadge';
import { StreamingLinks } from '@/components/song/StreamingLinks';
import { AudioPreview } from '@/components/song/AudioPreview';
import { listCatalog, type CatalogSong } from '@/lib/catalog/queries';
import { text } from '@/lib/copy/site-copy';
import { cents, formatCents } from '@/lib/money/cents';

export const revalidate = 60;

type CardLabels = {
  statusLabel: string;
  supporters: string;
  joinTheJourney: string;
  previewComingSoon: string;
};

function SongCard({ song, labels }: { song: CatalogSong; labels: CardLabels }) {
  const showMeter = song.goalCents > 0 && song.status !== 'released';

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-[var(--radius-panel)] border transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--champagne)]"
      style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
    >
      <Link href={`/song/${song.slug}`} className="block">
        {song.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={song.coverPath}
            alt=""
            width={480}
            height={480}
            className="aspect-square w-full object-cover"
            style={{ backgroundColor: 'var(--ink)' }}
          />
        ) : (
          <div className="aspect-square w-full" style={{ background: 'var(--ink)' }} />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={`/song/${song.slug}`}>
          <h3 className="font-serif text-xl leading-tight text-[var(--text)] group-hover:text-[var(--champagne)]">
            {song.title}
          </h3>
        </Link>

        <div>
          <StatusBadge status={song.status} label={labels.statusLabel} />
        </div>

        {song.supporterCount > 0 ? (
          <p className="flex items-center gap-2 font-ui text-xs text-[var(--text-dim)]">
            <Users aria-hidden size={13} />
            <span className="font-mono">{song.supporterCount.toLocaleString()}</span>
            {labels.supporters}
          </p>
        ) : null}

        <AudioPreview
          src={song.audioPath}
          previewStartMs={song.previewStartMs}
          previewEndMs={song.previewEndMs}
          comingSoonLabel={labels.previewComingSoon}
        />

        {showMeter ? (
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-ui text-xs text-[var(--text-dim)]">
                <span className="font-mono text-[var(--champagne)]">
                  {formatCents(cents(song.raisedCents))}
                </span>
                {' / '}
                <span className="font-mono">{formatCents(cents(song.goalCents))}</span>
              </p>
              <span className="font-mono text-xs text-[var(--champagne)]">{song.percent}%</span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full"
              style={{ background: 'var(--line)' }}
            >
              <div
                className="bg-gold h-full rounded-full"
                style={{ width: `${Math.min(100, song.percent)}%` }}
              />
            </div>
          </div>
        ) : (
          <StreamingLinks
            spotifyUrl={song.spotifyUrl}
            appleMusicUrl={song.appleMusicUrl}
            youtubeUrl={song.youtubeUrl}
          />
        )}

        <Link
          href={`/song/${song.slug}`}
          className="mt-auto block rounded-sm border py-2.5 text-center font-ui text-[0.6875rem] uppercase tracking-[0.18em] text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--champagne)] hover:text-[var(--champagne)]"
          style={{ borderColor: 'var(--line)' }}
        >
          {labels.joinTheJourney}
        </Link>
      </div>
    </article>
  );
}

function VaultCard({ song, label }: { song: CatalogSong; label: string }) {
  return (
    <article
      className="flex flex-col overflow-hidden rounded-[var(--radius-panel)] border"
      style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
    >
      <div className="relative aspect-square w-full" style={{ background: 'var(--ink)' }}>
        {song.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={song.coverPath}
            alt=""
            width={480}
            height={480}
            className="h-full w-full object-cover opacity-30"
          />
        ) : null}
        <Lock aria-hidden size={26} color="var(--champagne)" className="absolute inset-0 m-auto" />
      </div>
      <div className="p-4">
        <h3 className="font-serif text-xl text-[var(--text-dim)]">{song.title}</h3>
        <div className="mt-3">
          <StatusBadge status="vault" label={label} />
        </div>
      </div>
    </article>
  );
}

export default async function MusicPage() {
  const [
    catalog, title, releasedLabel, releasedSub, comingSoonLabel, comingSoonSub,
    buildingLabel, buildingSub, vaultLabel, joinJourney, empty,
    supportersLabel, previewComingSoon,
  ] = await Promise.all([
    listCatalog(),
    text('music.title'),
    text('music.released'), text('music.released_sub'),
    text('music.coming_soon'), text('music.coming_soon_sub'),
    text('music.building_now'), text('music.building_now_sub'),
    text('music.vault'),
    text('music.join_the_journey'),
    text('music.empty_section'),
    text('home.supporters'),
    text('song.preview_coming_soon'),
  ]);

  const sections = [
    {
      key: 'released' as const,
      heading: releasedLabel,
      sub: releasedSub,
      songs: catalog.filter((s) => s.status === 'released'),
    },
    {
      key: 'coming_soon' as const,
      heading: comingSoonLabel,
      sub: comingSoonSub,
      songs: catalog.filter((s) => s.status === 'coming_soon'),
    },
    {
      key: 'building' as const,
      heading: buildingLabel,
      sub: buildingSub,
      songs: catalog.filter((s) => s.status === 'building'),
    },
  ];

  const vault = catalog.filter((s) => s.status === 'vault');
  const statusLabelFor = { released: releasedLabel, coming_soon: comingSoonLabel, building: buildingLabel };

  return (
    <main className="surface-ink min-h-screen">
      <SiteNav sub="MUSIC" />

      <div className="mx-auto max-w-[92rem] px-6 py-12 md:px-10 md:py-14">
        <h1 className="sr-only">{title}</h1>

        {sections.map((section) =>
          section.songs.length > 0 ? (
            <section key={section.key} className="mb-14">
              <SectionHeading sub={section.sub}>{section.heading}</SectionHeading>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {section.songs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    labels={{
                      statusLabel: statusLabelFor[section.key],
                      supporters: supportersLabel,
                      joinTheJourney: joinJourney,
                      previewComingSoon,
                    }}
                  />
                ))}
              </div>
            </section>
          ) : null,
        )}

        {vault.length > 0 ? (
          <section className="mb-14">
            <SectionHeading>{vaultLabel}</SectionHeading>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {vault.map((song) => (
                <VaultCard key={song.id} song={song} label={vaultLabel} />
              ))}
            </div>
          </section>
        ) : null}

        {catalog.length === 0 ? (
          <p className="py-16 text-body text-[var(--text-dim)]">{empty}</p>
        ) : null}
      </div>
      <SiteFooter />
      <MobileCta />
    </main>
  );
}
