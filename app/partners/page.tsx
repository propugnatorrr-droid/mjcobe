import Link from 'next/link';
import { Check } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { FundingMeter } from '@/components/primitives/FundingMeter';
import { AmountFigure } from '@/components/primitives/AmountFigure';
import { ButtonLink } from '@/components/primitives/Button';
import { getPartnersPage } from '@/lib/partners/queries';
import { text } from '@/lib/copy/site-copy';
import { cents } from '@/lib/money/cents';

export const revalidate = 60;

export default async function PartnersPage() {
  const [data, title, sub, cta, acceptingHeading, packagesHeading, viewCampaign,
    statsHeading, statRaised, statSponsorCount, pastSponsors, custom, contact, empty] =
    await Promise.all([
      getPartnersPage(),
      text('partners.title'),
      text('partners.sub'),
      text('partners.cta'),
      text('partners.accepting_heading'),
      text('partners.packages_heading'),
      text('partners.view_campaign'),
      text('partners.stats_heading'),
      text('partners.stat.raised'),
      text('partners.stat.sponsor_count'),
      text('partners.past_sponsors'),
      text('partners.custom'),
      text('partners.contact'),
      text('partners.empty'),
    ]);

  return (
    <main className="surface-ink min-h-screen">
      <SiteNav />

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
        <h1 className="font-display text-display text-[var(--text)]">{title}</h1>
        <p className="mt-4 max-w-[62ch] text-body text-[var(--text-dim)]">{sub}</p>
        <div className="mt-8">
          <ButtonLink href="#packages" variant="primary" glow>
            {cta}
          </ButtonLink>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 md:px-12 md:pb-24">
        <Eyebrow>{statsHeading}</Eyebrow>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div
            className="rounded-[var(--radius-panel)] border p-6"
            style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
          >
            <p className="font-display text-4xl text-[var(--champagne)]">
              <AmountFigure cents={cents(data.totalSponsorCents)} />
            </p>
            <p className="mt-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              {statRaised}
            </p>
          </div>
          <div
            className="rounded-[var(--radius-panel)] border p-6"
            style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
          >
            <p className="font-display text-4xl text-[var(--champagne)]">{data.totalSponsorCount}</p>
            <p className="mt-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              {statSponsorCount}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 md:px-12 md:pb-24">
        <Eyebrow>{acceptingHeading}</Eyebrow>
        {data.accepting.length === 0 ? (
          <p className="mt-8 text-body text-[var(--text-dim)]">{empty}</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {data.accepting.map((c) => (
              <div
                key={c.campaignId}
                className="rounded-[var(--radius-panel)] border p-6"
                style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
              >
                <h3 className="font-display text-2xl text-[var(--text)]">{c.songTitle}</h3>
                <div className="mt-4">
                  <FundingMeter percent={c.percent} />
                </div>
                <div className="mt-4">
                  <ButtonLink href={`/song/${c.songSlug}`} variant="ghost">
                    {viewCampaign}
                  </ButtonLink>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="packages" className="mx-auto max-w-6xl px-6 pb-16 md:px-12 md:pb-24">
        <Eyebrow>{packagesHeading}</Eyebrow>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data.packages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex flex-col rounded-[var(--radius-panel)] border p-6"
              style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
            >
              <p className="font-mono text-eyebrow uppercase text-[var(--champagne)]">{pkg.name}</p>
              <p className="mt-3 font-display text-3xl text-[var(--text)]">
                <AmountFigure cents={cents(pkg.priceCents)} />
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {pkg.deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-body text-[var(--text-dim)]">
                    <Check aria-hidden size={16} color="var(--champagne)" className="mt-1 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-8 text-body text-[var(--text-dim)]">{custom}</p>
        <p className="mt-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">{contact}</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-12">
        <Eyebrow>{pastSponsors}</Eyebrow>
        <div className="mt-8 flex flex-wrap gap-8">
          {data.sponsors.map((sp) => (
            <Link
              key={sp.id}
              href={sp.website ?? '#'}
              className="flex items-center gap-3 text-body text-[var(--text-dim)] hover:text-[var(--text)]"
            >
              {sp.logoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sp.logoPath} alt="" width={32} height={32} className="h-8 w-auto" />
              ) : null}
              {sp.businessName}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
