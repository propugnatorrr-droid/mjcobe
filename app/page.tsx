import Link from 'next/link';
import { Play, ArrowRight, Users, Heart, Sparkles } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { LookbookImage } from '@/components/primitives/LookbookImage';
import { PhotoTreatment } from '@/components/treatments/PhotoTreatment';
import { ButtonLink } from '@/components/primitives/Button';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { getLookbookImage } from '@/lib/lookbook/manifest';
import { listCatalog } from '@/lib/catalog/queries';
import { getLeaderboard } from '@/lib/campaign/queries';
import { text } from '@/lib/copy/site-copy';
import { cents, formatCents } from '@/lib/money/cents';
import type { LeaderboardRowData } from '@/lib/campaign/queries';

export const revalidate = 60;

function initialOf(name: string) {
  return name.replace('@', '').charAt(0).toUpperCase() || '?';
}

async function SpotlightRow({
  label,
  row,
  icon,
}: {
  label: string;
  row: LeaderboardRowData;
  icon: React.ReactNode;
}) {
  const anonymous = await text('song.anonymous');
  const hidden = await text('song.amount_hidden');
  const name = row.isAnonymous ? anonymous : row.name;

  return (
    <div>
      <p className="font-ui text-[0.625rem] uppercase tracking-[0.24em] text-[var(--champagne)]">
        {label}
      </p>
      <div className="mt-3 flex items-center gap-3">
        {row.logoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.logoPath}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
            style={{ outline: '1px solid var(--champagne)' }}
          />
        ) : (
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif text-sm text-[var(--champagne)]"
            style={{ background: 'var(--ink)', outline: '1px solid var(--champagne)' }}
          >
            {initialOf(name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-ui text-sm text-[var(--text)]">{name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 font-ui text-xs text-[var(--text-dim)]">
            {icon}
            {row.hideAmount ? hidden : formatCents(cents(row.amountCents))}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [hero, catalog] = await Promise.all([
    Promise.resolve(getLookbookImage('hero')),
    listCatalog(),
  ]);

  const featured = catalog.find((s) => s.status === 'building') ?? null;
  const [topFan, topSponsor] = featured?.campaignId
    ? await Promise.all([
        getLeaderboard(featured.campaignId, 'fan', 1),
        getLeaderboard(featured.campaignId, 'business', 1),
      ])
    : [null, null];

  const [
    artistName, tagline, subcopy, listenLabel, ctaLabel,
    currentlyBuilding, newSingle, viewProject, supportersLabel,
    raisedToward, fundedLabel, topFanHeading, topSponsorHeading, empty,
  ] = await Promise.all([
    text('hero.artist_name'), text('hero.tagline'), text('hero.subcopy'),
    text('home.listen'), text('nav.cta'),
    text('home.currently_building'), text('home.new_single'), text('home.view_project'),
    text('home.supporters'), text('home.raised_toward'), text('home.funded'),
    text('home.top_fan_heading'), text('home.top_sponsor_heading'), text('home.empty'),
  ]);

  return (
    <main className="surface-ink min-h-screen">
      <SiteNav />

      {/* Hero: full-bleed photograph, statement type overlaid on the left. */}
      <section className="relative isolate min-h-[34rem] overflow-hidden md:min-h-[38rem]">
        {/* The portrait is tall; it occupies the right half rather than being
            cover-cropped into a letterbox slice, which would show a sliver. */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-y-0 right-0 w-full md:w-[58%] lg:w-[52%]">
            <PhotoTreatment vignette grain fill>
              <LookbookImage
                asset={hero}
                sizes="(min-width: 768px) 58vw, 100vw"
                priority
                className="absolute inset-0 h-full w-full object-cover"
                objectPosition="50% 22%"
              />
            </PhotoTreatment>
          </div>
          {/* Left-weighted scrim so the headline keeps contrast over the image. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, var(--ink) 0%, var(--ink) 30%, rgba(10,10,11,0.86) 46%, rgba(10,10,11,0.35) 62%, rgba(10,10,11,0.15) 100%)',
            }}
          />
        </div>

        <div className="mx-auto flex min-h-[34rem] max-w-[92rem] flex-col justify-center px-6 py-16 md:min-h-[38rem] md:px-10">
          <h1 className="max-w-4xl font-display text-[clamp(2.75rem,7.5vw,6.5rem)] leading-[0.94] tracking-[-0.01em] text-[var(--text)]">
            {artistName} /<br />
            {tagline}
          </h1>
          <p className="mt-6 max-w-[46ch] text-body text-[var(--text-dim)]">{subcopy}</p>

          <div className="mt-9 flex flex-wrap gap-4">
            <ButtonLink href="/music" variant="ghost" className="!rounded-none">
              {listenLabel}
              <Play aria-hidden size={14} className="ml-2.5" />
            </ButtonLink>
            <ButtonLink href="/back" variant="primary" glow className="!rounded-none">
              {ctaLabel}
              <ArrowRight aria-hidden size={15} className="ml-2.5" />
            </ButtonLink>
          </div>
        </div>
      </section>

      {featured ? (
        <section className="mx-auto max-w-[92rem] px-6 py-14 md:px-10 md:py-16">
          <div className="flex items-center gap-6">
            <h2 className="shrink-0 font-ui text-xs uppercase tracking-[0.28em] text-[var(--champagne)]">
              {currentlyBuilding}
            </h2>
            <span className="rule-gold h-px flex-1 opacity-50" />
            <Sparkles aria-hidden size={16} color="var(--champagne)" />
          </div>

          <div
            className="mt-7 grid grid-cols-1 gap-8 rounded-[var(--radius-panel)] border p-6 md:p-8 lg:grid-cols-[13rem_1fr_16rem]"
            style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
          >
            <Link href={`/song/${featured.slug}`} className="block">
              {featured.coverPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.coverPath}
                  alt=""
                  width={208}
                  height={208}
                  className="aspect-square w-full rounded-sm object-cover"
                  style={{ backgroundColor: 'var(--ink)', outline: '1px solid var(--line)' }}
                />
              ) : (
                <div
                  className="aspect-square w-full rounded-sm"
                  style={{ background: 'var(--ink)', outline: '1px solid var(--line)' }}
                />
              )}
            </Link>

            <div className="flex flex-col justify-center">
              <p className="font-ui text-[0.625rem] uppercase tracking-[0.24em] text-[var(--champagne)]">
                {newSingle}
              </p>
              <h3 className="mt-2 font-serif text-[clamp(1.75rem,3.4vw,2.75rem)] leading-tight text-[var(--text)]">
                <Link href={`/song/${featured.slug}`} className="hover:text-[var(--champagne)]">
                  {featured.title}
                </Link>
              </h3>

              <div className="mt-5 flex items-center gap-5">
                <div className="shrink-0">
                  <p className="font-serif text-3xl leading-none text-gold">{featured.percent}%</p>
                  <p className="mt-1 font-ui text-[0.625rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {fundedLabel}
                  </p>
                </div>
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full"
                  style={{ background: 'var(--line)' }}
                >
                  <div
                    className="bg-gold h-full rounded-full"
                    style={{ width: `${Math.min(100, featured.percent)}%` }}
                  />
                </div>
              </div>

              <p className="mt-4 font-ui text-sm text-[var(--text-dim)]">
                <span className="font-mono text-[var(--champagne)]">
                  {formatCents(cents(featured.raisedCents))}
                </span>{' '}
                {raisedToward}{' '}
                <span className="font-mono">{formatCents(cents(featured.goalCents))}</span>
              </p>

              <div
                className="mt-6 flex flex-wrap items-center justify-between gap-5 border-t pt-6"
                style={{ borderColor: 'var(--line)' }}
              >
                <p className="flex items-center gap-2.5">
                  <Users aria-hidden size={18} color="var(--text-dim)" />
                  <span className="font-mono text-2xl text-[var(--text)]">
                    {featured.supporterCount}
                  </span>
                  <span className="font-ui text-[0.625rem] uppercase tracking-[0.2em] text-[var(--text-dim)]">
                    {supportersLabel}
                  </span>
                </p>
                <ButtonLink href={`/song/${featured.slug}`} variant="ghost" className="!rounded-none">
                  {viewProject}
                  <ArrowRight aria-hidden size={15} className="ml-2.5" />
                </ButtonLink>
              </div>
            </div>

            <div
              className="flex flex-col justify-center gap-7 lg:border-l lg:pl-8"
              style={{ borderColor: 'var(--line)' }}
            >
              {topFan?.rows[0] ? (
                <SpotlightRow
                  label={topFanHeading}
                  row={topFan.rows[0]}
                  icon={<Heart aria-hidden size={12} color="var(--champagne)" />}
                />
              ) : null}
              {topSponsor?.rows[0] ? (
                <div
                  className={topFan?.rows[0] ? 'border-t pt-7' : undefined}
                  style={topFan?.rows[0] ? { borderColor: 'var(--line)' } : undefined}
                >
                  <SpotlightRow
                    label={topSponsorHeading}
                    row={topSponsor.rows[0]}
                    icon={<Sparkles aria-hidden size={12} color="var(--champagne)" />}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-[92rem] px-6 py-16 md:px-10">
          <SectionHeading>{currentlyBuilding}</SectionHeading>
          <p className="mt-6 text-body text-[var(--text-dim)]">{empty}</p>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
