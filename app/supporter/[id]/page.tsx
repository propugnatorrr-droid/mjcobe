import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { getSupporterProfile } from '@/lib/supporter/queries';
import { badgeIcon } from '@/lib/supporter/badges';
import { text } from '@/lib/copy/site-copy';
import { cents, formatCents } from '@/lib/money/cents';

export const revalidate = 300;

export default async function SupporterProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getSupporterProfile(id);
  if (!profile) notFound();

  const [
    since, songsBacked, totalContributions, badgesLabel, songsHelped,
    noBadges, contributedLabel,
  ] = await Promise.all([
    text('supporter.since', { year: String(profile.since.getFullYear()) }),
    text('supporter.songs_backed'),
    text('supporter.total_contributions'),
    text('supporter.badges'),
    text('supporter.songs_helped'),
    text('supporter.no_badges'),
    text('supporter.contributed'),
  ]);

  const initial = profile.displayName.replace('@', '').charAt(0).toUpperCase() || '?';

  return (
    <main className="surface-ink min-h-screen">
      <SiteNav />

      {/* Identity band */}
      <section
        className="border-b py-12"
        style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
      >
        <div className="mx-auto flex max-w-[92rem] flex-wrap items-center gap-8 px-6 md:px-10">
          <span
            aria-hidden
            className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full font-serif text-5xl text-gold"
            style={{ background: 'var(--ink)', outline: '2px solid var(--champagne)' }}
          >
            {initial}
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[clamp(2rem,5.5vw,4rem)] uppercase leading-none text-[var(--text)]">
              {profile.displayName}
            </h1>
            <p className="mt-3 font-ui text-[0.6875rem] uppercase tracking-[0.26em] text-[var(--champagne)]">
              {since}
            </p>

            {(profile.instagram || profile.tiktok || profile.website) && (
              <div className="mt-4 flex flex-wrap gap-5 font-ui text-xs text-[var(--text-dim)]">
                {profile.instagram ? (
                  <Link
                    href={`https://instagram.com/${profile.instagram}`}
                    className="hover:text-[var(--champagne)]"
                  >
                    @{profile.instagram}
                  </Link>
                ) : null}
                {profile.tiktok ? (
                  <Link
                    href={`https://tiktok.com/@${profile.tiktok}`}
                    className="hover:text-[var(--champagne)]"
                  >
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
          </div>

          <div
            className="flex shrink-0 gap-10 md:border-l md:pl-10"
            style={{ borderColor: 'var(--line)' }}
          >
            <div>
              <p className="font-serif text-4xl leading-none text-[var(--text)]">
                {profile.songs.length}
              </p>
              <p className="mt-2 font-ui text-[0.5625rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                {songsBacked}
              </p>
            </div>
            <div>
              <p className="font-serif text-4xl leading-none text-gold">
                {formatCents(cents(profile.totalContributionsCents))}
              </p>
              <p className="mt-2 font-ui text-[0.5625rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                {totalContributions}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[92rem] px-6 py-12 md:px-10">
        {/* Badges */}
        <section>
          <SectionHeading>{badgesLabel}</SectionHeading>
          {profile.badges.length === 0 ? (
            <p className="mt-6 text-body text-[var(--text-dim)]">{noBadges}</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {profile.badges.map((b) => {
                const Icon = badgeIcon(b.key);
                return (
                  <div
                    key={b.key}
                    className="flex flex-col items-center gap-3 rounded-[var(--radius-panel)] border p-5 text-center"
                    style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
                  >
                    <span
                      className="flex h-14 w-14 items-center justify-center rounded-full"
                      style={{ outline: '1px solid var(--champagne)' }}
                    >
                      <Icon aria-hidden size={22} color="var(--champagne)" />
                    </span>
                    <span className="font-ui text-[0.625rem] uppercase leading-tight tracking-[0.14em] text-[var(--text)]">
                      {b.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Records helped */}
        {profile.songs.length > 0 ? (
          <section className="mt-14">
            <SectionHeading>{songsHelped}</SectionHeading>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {profile.songs.map((song) => (
                <Link
                  key={song.id}
                  href={`/song/${song.slug}`}
                  className="group flex items-center gap-4 rounded-[var(--radius-panel)] border p-4 transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--champagne)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
                >
                  {song.coverPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={song.coverPath}
                      alt=""
                      width={72}
                      height={72}
                      className="shrink-0 rounded-sm object-cover"
                      style={{ height: 72, width: 72, background: 'var(--ink)' }}
                    />
                  ) : (
                    <div
                      className="shrink-0 rounded-sm"
                      style={{ height: 72, width: 72, background: 'var(--ink)' }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-lg text-[var(--text)] group-hover:text-[var(--champagne)]">
                      {song.title}
                    </p>
                    <p className="mt-1.5 font-ui text-[0.5625rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                      {contributedLabel}
                    </p>
                    <p className="mt-1 font-mono text-lg text-gold">
                      {formatCents(cents(song.contributedCents))}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <SiteFooter />
    </main>
  );
}
