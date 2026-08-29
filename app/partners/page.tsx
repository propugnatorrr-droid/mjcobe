import Link from 'next/link';
import {
  Monitor, Star, Clapperboard, Crown, ChevronRight, Handshake,
  DollarSign, Users, Music2, Check,
} from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileCta } from '@/components/MobileCta';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { LookbookImage } from '@/components/primitives/LookbookImage';
import { PhotoTreatment } from '@/components/treatments/PhotoTreatment';
import { ButtonLink } from '@/components/primitives/Button';
import { getLookbookImage } from '@/lib/lookbook/manifest';
import { getImageByPath } from '@/lib/media/queries';
import { getPartnersPage } from '@/lib/partners/queries';
import { text } from '@/lib/copy/site-copy';
import { cents, formatCents } from '@/lib/money/cents';

export const revalidate = 60;

/** Package tiers ascend; the icon follows the rung rather than the name, so
 * a renamed package still gets a sensible mark. */
const PACKAGE_ICONS = [Monitor, Star, Clapperboard, Crown];

export default async function PartnersPage() {
  const [
    data, buildWith, artistName, sub, viewPackages, applyLabel,
    acceptingHeading, seekingSponsors, packagesHeading, mostPopular,
    statsHeading, statRaised, statSponsorCount, statSupporters, statSongs,
    growing, pastSponsors, custom, contact, empty,
  ] = await Promise.all([
    getPartnersPage(),
    text('partners.build_with'), text('hero.artist_name'), text('partners.sub'),
    text('partners.view_packages'), text('partners.apply'),
    text('partners.accepting_heading'), text('partners.seeking_sponsors'),
    text('partners.brand_packages'), text('partners.most_popular'),
    text('partners.stats_heading'), text('partners.stat.raised'),
    text('partners.stat.sponsor_count'), text('partners.stat.supporters'),
    text('partners.stat.songs'), text('partners.growing'),
    text('partners.past_sponsors'), text('partners.custom'),
    text('partners.contact'), text('partners.empty'),
  ]);

  // Prefer the delivered landscape press shot; fall back to the portrait.
  const hero = (await getImageByPath('/media/press-partners-1792.jpg')) ?? getLookbookImage('hero');

  const stats = [
    { icon: DollarSign, value: formatCents(cents(data.totalSponsorCents)), label: statRaised },
    { icon: Handshake, value: String(data.totalSponsorCount), label: statSponsorCount },
    { icon: Users, value: data.totalSupporterCount.toLocaleString(), label: statSupporters },
    { icon: Music2, value: String(data.totalSongCount), label: statSongs },
  ];

  // The mockup marks the second rung "most popular"; derive it from position
  // so it stays correct if packages are renamed or repriced in admin.
  const popularIndex = data.packages.length > 1 ? 1 : -1;

  return (
    <main className="story-v4-page partners-v4-page surface-ink min-h-screen">
      <SiteNav sub="PARTNERS" />

      {/* Hero */}
      <section className="partners-v4-hero relative isolate min-h-[26rem] overflow-hidden md:min-h-[30rem]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-y-0 right-0 w-full md:w-[54%]">
            <PhotoTreatment vignette grain fill>
              <LookbookImage
                asset={hero}
                sizes="(min-width: 768px) 54vw, 100vw"
                priority
                className="absolute inset-0 h-full w-full object-cover"
                objectPosition="50% 35%"
              />
            </PhotoTreatment>
          </div>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, var(--ink) 0%, var(--ink) 32%, rgba(10,10,11,0.85) 48%, rgba(10,10,11,0.3) 66%, rgba(10,10,11,0.12) 100%)',
            }}
          />
        </div>

        <div className="mx-auto flex min-h-[26rem] max-w-[92rem] flex-col justify-center px-6 py-14 md:min-h-[30rem] md:px-10">
          <h1 className="font-display text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[0.94] text-[var(--text)]">
            {buildWith}
            <br />
            <span className="text-gold">{artistName}</span>
          </h1>
          <span className="rule-gold mt-6 block h-px w-24 opacity-80" />
          <p className="mt-6 max-w-[42ch] text-body text-[var(--text-dim)]">{sub}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <ButtonLink href="#packages" variant="primary" glow className="!rounded-sm">
              {viewPackages}
            </ButtonLink>
            <ButtonLink href="#packages" variant="ghost" className="!rounded-sm">
              {applyLabel}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Campaigns accepting sponsors */}
      <section className="partners-v4-section">
        <SectionHeading sub={seekingSponsors}>{acceptingHeading}</SectionHeading>

        {data.accepting.length === 0 ? (
          <p className="mt-6 text-body text-[var(--text-dim)]">{empty}</p>
        ) : (
          <div className="partners-v4-campaign-grid mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.accepting.map((c) => (
              <Link
                key={c.campaignId}
                href={`/song/${c.songSlug}`}
                className="group flex gap-4 overflow-hidden rounded-[var(--radius-panel)] border p-4 transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--champagne)]"
                style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
              >
                {c.coverPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.coverPath}
                    alt=""
                    width={88}
                    height={88}
                    className="h-22 w-22 shrink-0 rounded-sm object-cover"
                    style={{ height: 88, width: 88, background: 'var(--ink)' }}
                  />
                ) : (
                  <div
                    className="shrink-0 rounded-sm"
                    style={{ height: 88, width: 88, background: 'var(--ink)' }}
                  />
                )}
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <h3 className="truncate font-serif text-lg text-[var(--text)] group-hover:text-[var(--champagne)]">
                    {c.songTitle}
                  </h3>
                  <p className="mt-1 font-ui text-[0.625rem] uppercase tracking-[0.2em] text-[var(--champagne)]">
                    {seekingSponsors}
                  </p>
                  <div
                    className="mt-3 h-1.5 overflow-hidden rounded-full"
                    style={{ background: 'var(--line)' }}
                  >
                    <div
                      className="bg-gold h-full rounded-full"
                      style={{ width: `${Math.min(100, c.percent)}%` }}
                    />
                  </div>
                </div>
                <ChevronRight
                  aria-hidden
                  size={18}
                  color="var(--text-faint)"
                  className="mt-auto mb-auto shrink-0"
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Packages */}
      <section id="packages" className="partners-v4-section partners-v4-packages">
        <SectionHeading>{packagesHeading}</SectionHeading>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data.packages.map((pkg, i) => {
            const Icon = PACKAGE_ICONS[i] ?? Star;
            const popular = i === popularIndex;
            return (
              <div
                key={pkg.id}
                className="partners-v4-package relative flex flex-col rounded-[var(--radius-panel)] border p-6"
                style={{
                  borderColor: popular ? 'var(--champagne)' : 'var(--line)',
                  background: 'var(--ink-2)',
                  boxShadow: popular ? 'var(--glow-champagne)' : undefined,
                }}
              >
                {popular ? (
                  <span
                    className="bg-gold absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 font-ui text-[0.5625rem] uppercase tracking-[0.18em] text-[var(--ink)]"
                  >
                    {mostPopular}
                  </span>
                ) : null}

                <Icon aria-hidden size={26} color="var(--champagne)" className="mx-auto" />
                <h3 className="mt-4 text-center font-display text-lg uppercase tracking-[0.08em] text-[var(--text)]">
                  {pkg.name}
                </h3>
                <p className="mt-2 text-center font-serif text-3xl text-gold">
                  {formatCents(cents(pkg.priceCents))}
                </p>

                <span className="rule-gold my-5 h-px w-full opacity-40" />

                <ul className="flex flex-1 flex-col gap-2.5">
                  {pkg.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2 font-ui text-xs text-[var(--text-dim)]">
                      <Check aria-hidden size={13} color="var(--champagne)" className="mt-0.5 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Handshake aria-hidden size={20} color="var(--champagne)" />
          <p className="text-body text-[var(--champagne)]">{custom}</p>
          <p className="text-body text-[var(--text-dim)]">{contact}</p>
        </div>
      </section>

      {/* Impact */}
      <section
        className="partners-v4-impact border-y py-12"
        style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
      >
        <div className="mx-auto max-w-[92rem] px-6 md:px-10">
          <p className="font-ui text-[0.625rem] uppercase tracking-[0.28em] text-[var(--champagne)]">
            {statsHeading}
          </p>
          <div className="mt-7 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <s.icon aria-hidden size={26} color="var(--champagne)" className="shrink-0" />
                <div className="min-w-0">
                  <p className="font-serif text-[clamp(1.5rem,3vw,2.25rem)] leading-none text-gold">
                    {s.value}
                  </p>
                  <p className="mt-1.5 font-ui text-[0.5625rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center font-ui text-[0.625rem] uppercase tracking-[0.24em] text-[var(--text-faint)]">
            {growing}
          </p>
        </div>
      </section>

      {/* Roster */}
      {data.sponsors.length > 0 ? (
        <section className="partners-v4-roster">
          <p className="text-center font-ui text-[0.625rem] uppercase tracking-[0.28em] text-[var(--text-dim)]">
            {pastSponsors}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
            {data.sponsors.map((sp) => (
              <Link
                key={sp.id}
                href={`/partner/${sp.slug}`}
                className="flex items-center gap-3 font-serif text-lg tracking-[0.06em] text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--champagne)]"
              >
                {sp.logoPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sp.logoPath} alt="" width={28} height={28} className="h-7 w-auto" />
                ) : null}
                {sp.businessName}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <SiteFooter />
      <MobileCta />
    </main>
  );
}
