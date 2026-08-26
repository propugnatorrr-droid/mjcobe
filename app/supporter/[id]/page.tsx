import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { AmountFigure } from '@/components/primitives/AmountFigure';
import { getSupporterProfile } from '@/lib/supporter/queries';
import { text } from '@/lib/copy/site-copy';
import { cents } from '@/lib/money/cents';

export const revalidate = 300;

export default async function SupporterProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getSupporterProfile(id);

  if (!profile) notFound();

  const [since, songsBacked, totalContributions, badgesLabel, songsHelped, noBadges, contributedLabel] =
    await Promise.all([
      text('supporter.since', { year: String(profile.since.getFullYear()) }),
      text('supporter.songs_backed'),
      text('supporter.total_contributions'),
      text('supporter.badges'),
      text('supporter.songs_helped'),
      text('supporter.no_badges'),
      text('supporter.contributed'),
    ]);

  return (
    <main className="surface-ink min-h-screen">
      <SiteNav />

      <section className="mx-auto max-w-3xl px-6 py-16 md:px-12 md:py-24">
        <h1 className="font-display text-display text-[var(--text)]">{profile.displayName}</h1>
        <p className="mt-2 font-mono text-eyebrow uppercase text-[var(--champagne)]">{since}</p>

        {(profile.instagram || profile.tiktok || profile.website) && (
          <div className="mt-4 flex flex-wrap gap-4 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {profile.instagram ? (
              <Link href={`https://instagram.com/${profile.instagram}`} className="hover:text-[var(--champagne)]">
                @{profile.instagram}
              </Link>
            ) : null}
            {profile.tiktok ? (
              <Link href={`https://tiktok.com/@${profile.tiktok}`} className="hover:text-[var(--champagne)]">
                @{profile.tiktok}
              </Link>
            ) : null}
            {profile.website ? (
              <Link href={profile.website} className="hover:text-[var(--champagne)]">
                {profile.website}
              </Link>
            ) : null}
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div
            className="rounded-[var(--radius-panel)] border p-6"
            style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
          >
            <p className="font-display text-4xl text-[var(--champagne)]">{profile.songs.length}</p>
            <p className="mt-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">{songsBacked}</p>
          </div>
          <div
            className="rounded-[var(--radius-panel)] border p-6"
            style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
          >
            <p className="font-display text-4xl text-[var(--champagne)]">
              <AmountFigure cents={cents(profile.totalContributionsCents)} />
            </p>
            <p className="mt-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              {totalContributions}
            </p>
          </div>
        </div>

        <div className="mt-12">
          <Eyebrow>{badgesLabel}</Eyebrow>
          {profile.badges.length === 0 ? (
            <p className="mt-4 text-body text-[var(--text-dim)]">{noBadges}</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              {profile.badges.map((b) => (
                <span
                  key={b.key}
                  className="rounded-full border px-4 py-1.5 font-mono text-eyebrow uppercase text-[var(--champagne)]"
                  style={{ borderColor: 'var(--champagne)' }}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {profile.songs.length > 0 ? (
          <div className="mt-12">
            <Eyebrow>{songsHelped}</Eyebrow>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {profile.songs.map((song) => (
                <Link
                  key={song.id}
                  href={`/song/${song.slug}`}
                  className="flex flex-col gap-2 rounded-[var(--radius-panel)] border p-3 transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--champagne)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
                >
                  {song.coverPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={song.coverPath}
                      alt=""
                      width={160}
                      height={160}
                      className="aspect-square w-full rounded-[var(--radius-panel)] object-cover"
                    />
                  ) : null}
                  <p className="text-body text-[var(--text)]">{song.title}</p>
                  <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                    {contributedLabel} <AmountFigure cents={cents(song.contributedCents)} />
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
