import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Globe, AtSign, ShoppingBag, Crown, Calendar, ArrowUpRight } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { getSponsorProfile } from '@/lib/sponsor/queries';
import { text } from '@/lib/copy/site-copy';
import { setting } from '@/lib/config/settings';
import { cents, formatCents } from '@/lib/money/cents';

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export default async function SponsorProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = await getSponsorProfile(slug);
  if (!profile) notFound();

  const [
    officialSupporterOf, contributedLabel, totalContribution, presenting,
    websiteLabel, instagramLabel, shopLabel, brandProfile,
  ] = await Promise.all([
    text('partner.official_supporter'),
    text('partner.contributed'),
    text('partner.total_contribution'),
    text('partner.presenting'),
    text('partner.website'),
    text('partner.instagram'),
    text('partner.shop'),
    text('partner.brand_profile'),
  ]);

  let sinceLabel: string | null = null;
  if (profile.supportedSince) {
    const locale = await setting('locale');
    const timeZone = await setting('displayTimeZone');
    const month = new Intl.DateTimeFormat(locale, { month: 'long', timeZone })
      .format(profile.supportedSince);
    sinceLabel = await text('partner.since', {
      month,
      year: String(profile.supportedSince.getFullYear()),
    });
  }

  const totalCents = profile.songs.reduce((sum, s) => sum + s.contributedCents, 0);

  const links = [
    { href: profile.website, label: websiteLabel, Icon: Globe, display: profile.website },
    {
      href: profile.instagram ? `https://instagram.com/${profile.instagram}` : null,
      label: instagramLabel,
      Icon: AtSign,
      display: profile.instagram ? `@${profile.instagram}` : null,
    },
    { href: profile.shopUrl, label: shopLabel, Icon: ShoppingBag, display: profile.shopUrl },
  ].filter((l): l is { href: string; label: string; Icon: typeof Globe; display: string } =>
    Boolean(l.href && l.display),
  );

  return (
    <main className="surface-ink min-h-screen">
      <SiteNav sub="PARTNERS" />

      <div className="mx-auto grid max-w-[92rem] grid-cols-1 gap-8 px-6 py-12 md:px-10 lg:grid-cols-[1fr_23rem]">
        <div>
          {/* Presenting-partner hero card, gold-framed as in the mockup. */}
          <div
            className="relative overflow-hidden rounded-[var(--radius-panel)] border p-6 md:p-8"
            style={{
              borderColor: 'var(--champagne)',
              background: 'var(--ink-2)',
              boxShadow: 'var(--glow-champagne)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 font-ui text-[0.625rem] uppercase tracking-[0.2em] text-[var(--champagne)]"
                style={{ borderColor: 'var(--champagne)' }}
              >
                <Crown aria-hidden size={13} />
                {presenting}
              </span>
              {sinceLabel ? (
                <span className="flex items-center gap-2 font-ui text-[0.625rem] uppercase tracking-[0.18em] text-[var(--text-dim)]">
                  <Calendar aria-hidden size={13} />
                  {sinceLabel}
                </span>
              ) : null}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-7">
              {profile.logoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.logoPath}
                  alt=""
                  width={140}
                  height={140}
                  className="h-28 w-28 shrink-0 rounded-sm object-contain p-3"
                  style={{ background: 'var(--ink)', outline: '1px solid var(--line)' }}
                />
              ) : (
                <span
                  aria-hidden
                  className="flex h-28 w-28 shrink-0 items-center justify-center rounded-sm font-serif text-4xl text-gold"
                  style={{ background: 'var(--ink)', outline: '1px solid var(--line)' }}
                >
                  {profile.businessName.charAt(0).toUpperCase()}
                </span>
              )}

              <div className="min-w-0">
                <h1 className="font-display text-[clamp(1.75rem,4vw,3rem)] uppercase leading-none tracking-[0.02em] text-[var(--text)]">
                  {profile.businessName}
                </h1>
                <p className="mt-3 flex flex-wrap items-baseline gap-3">
                  <span className="font-serif text-3xl text-gold">
                    {formatCents(cents(totalCents))}
                  </span>
                  <span className="font-ui text-[0.625rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {contributedLabel}
                  </span>
                </p>
              </div>
            </div>

            {profile.description ? (
              <p className="mt-6 max-w-[62ch] text-body text-[var(--text-dim)]">
                {profile.description}
              </p>
            ) : null}

            {profile.website ? (
              <Link
                href={profile.website}
                className="mt-6 inline-flex items-center gap-2 font-ui text-xs uppercase tracking-[0.16em] text-[var(--champagne)] hover:underline"
              >
                <Globe aria-hidden size={14} />
                {await text('partner.visit')}
                <ArrowUpRight aria-hidden size={14} />
              </Link>
            ) : null}
          </div>

          {/* Records this brand backs */}
          {profile.songs.length > 0 ? (
            <section className="mt-10">
              <SectionHeading>{officialSupporterOf}</SectionHeading>
              <div className="mt-6 flex flex-col gap-3">
                {profile.songs.map((song) => (
                  <Link
                    key={song.id}
                    href={`/song/${song.slug}`}
                    className="group flex items-center justify-between gap-5 rounded-[var(--radius-panel)] border p-5 transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--champagne)]"
                    style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
                  >
                    <span className="font-serif text-xl text-[var(--text)] group-hover:text-[var(--champagne)]">
                      {song.title}
                    </span>
                    <span className="flex shrink-0 items-baseline gap-3">
                      <span className="font-ui text-[0.5625rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                        {contributedLabel}
                      </span>
                      <span className="font-mono text-lg text-gold">
                        {formatCents(cents(song.contributedCents))}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* Brand sidebar */}
        <aside
          className="h-fit rounded-[var(--radius-panel)] border p-6"
          style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
        >
          <p className="font-ui text-[0.625rem] uppercase tracking-[0.24em] text-[var(--text-dim)]">
            {brandProfile}
          </p>

          <div
            className="mt-5 flex aspect-video items-center justify-center rounded-sm"
            style={{ background: 'var(--ink)', outline: '1px solid var(--line)' }}
          >
            {profile.logoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.logoPath}
                alt=""
                width={220}
                height={120}
                className="max-h-24 w-auto object-contain"
              />
            ) : (
              <span className="font-serif text-3xl text-gold">
                {profile.businessName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <p className="mt-5 font-ui text-[0.625rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
            {totalContribution}
          </p>
          <p className="mt-1 font-serif text-3xl text-gold">{formatCents(cents(totalCents))}</p>

          {profile.industry ? (
            <p className="mt-4 font-ui text-xs text-[var(--text-dim)]">{profile.industry}</p>
          ) : null}

          {links.length > 0 ? (
            <div className="mt-6 flex flex-col divide-y" style={{ borderColor: 'var(--line)' }}>
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="flex items-center justify-between gap-4 py-3.5 transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--champagne)]"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <span className="flex items-center gap-2.5 font-ui text-[0.625rem] uppercase tracking-[0.18em] text-[var(--champagne)]">
                    <l.Icon aria-hidden size={14} />
                    {l.label}
                  </span>
                  <span className="min-w-0 truncate font-ui text-xs text-[var(--text-dim)]">
                    {l.display}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </aside>
      </div>

      <SiteFooter />
    </main>
  );
}
