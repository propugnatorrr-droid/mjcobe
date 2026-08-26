import { Star, Trophy } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { RevealText } from '@/components/primitives/RevealText';
import { RevealImage } from '@/components/primitives/RevealImage';
import { LookbookImage } from '@/components/primitives/LookbookImage';
import { PhotoTreatment } from '@/components/treatments/PhotoTreatment';
import { ButtonLink } from '@/components/primitives/Button';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { FundingMeter } from '@/components/primitives/FundingMeter';
import { AmountFigure } from '@/components/primitives/AmountFigure';
import { getLookbookImage } from '@/lib/lookbook/manifest';
import { listCatalog } from '@/lib/catalog/queries';
import { getLeaderboard } from '@/lib/campaign/queries';
import { text } from '@/lib/copy/site-copy';
import { cents } from '@/lib/money/cents';
import type { LeaderboardRowData } from '@/lib/campaign/queries';

async function displayName(row: LeaderboardRowData) {
  return row.isAnonymous ? await text('song.anonymous') : row.name;
}

async function displayAmount(row: LeaderboardRowData) {
  return row.hideAmount ? await text('song.amount_hidden') : null;
}

export const revalidate = 60;

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

  return (
    <main className="surface-ink min-h-screen">
      <SiteNav />

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2 md:px-12 md:py-24">
        <div>
          <RevealText
            lines={[await text('hero.artist_name'), await text('hero.tagline')]}
            className="font-display text-display text-[var(--text)]"
          />
          <p className="mt-6 max-w-[46ch] text-body text-[var(--text-dim)]">
            {await text('hero.subcopy')}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <ButtonLink href="/music" variant="ghost">
              {await text('home.listen')}
            </ButtonLink>
            <ButtonLink href="/back" variant="primary" glow>
              {await text('nav.cta')}
            </ButtonLink>
          </div>
        </div>

        <div className="max-w-md justify-self-center md:justify-self-end">
          <RevealImage>
            <PhotoTreatment>
              <LookbookImage asset={hero} sizes="(min-width: 768px) 24rem, 100vw" />
            </PhotoTreatment>
          </RevealImage>
        </div>
      </section>

      {featured ? (
        <section className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
          <Eyebrow>{await text('home.currently_building')}</Eyebrow>

          <div
            className="mt-8 grid grid-cols-1 gap-8 rounded-[var(--radius-panel)] border p-6 md:grid-cols-[16rem_1fr] md:p-8"
            style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
          >
            {featured.coverPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.coverPath}
                alt=""
                width={256}
                height={256}
                className="aspect-square w-full rounded-[var(--radius-panel)] object-cover"
                style={{ backgroundColor: 'var(--ink)' }}
              />
            ) : (
              <div
                className="aspect-square w-full rounded-[var(--radius-panel)]"
                style={{ background: 'var(--ink)' }}
              />
            )}

            <div className="flex flex-col justify-center">
              <h3 className="font-display text-3xl text-[var(--text)]">{featured.title}</h3>
              <div className="mt-4 flex items-center gap-3 text-body text-[var(--text-dim)]">
                <AmountFigure cents={cents(featured.raisedCents)} />
                <span>/</span>
                <AmountFigure cents={cents(featured.goalCents)} />
                <span>·</span>
                <span className="font-mono">{featured.supporterCount} supporters</span>
              </div>
              <div className="mt-4">
                <FundingMeter percent={featured.percent} />
              </div>
              <div className="mt-6">
                <ButtonLink href={`/song/${featured.slug}`} variant="primary">
                  {await text('home.cta')}
                </ButtonLink>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {topSponsor?.rows[0] ? (
              <div
                className="flex items-center gap-4 rounded-[var(--radius-panel)] border p-5"
                style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
              >
                <Trophy aria-hidden size={20} color="var(--champagne)" />
                <div>
                  <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                    {await text('home.top_sponsor_heading')}
                  </p>
                  <p className="mt-1 flex items-baseline gap-3 text-body text-[var(--text)]">
                    {await displayName(topSponsor.rows[0])}
                    {topSponsor.rows[0].hideAmount ? (
                      await displayAmount(topSponsor.rows[0])
                    ) : (
                      <AmountFigure cents={cents(topSponsor.rows[0].amountCents)} />
                    )}
                  </p>
                </div>
              </div>
            ) : null}

            {topFan?.rows[0] ? (
              <div
                className="flex items-center gap-4 rounded-[var(--radius-panel)] border p-5"
                style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
              >
                <Star aria-hidden size={20} color="var(--champagne)" />
                <div>
                  <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                    {await text('home.top_fan_heading')}
                  </p>
                  <p className="mt-1 flex items-baseline gap-3 text-body text-[var(--text)]">
                    {await displayName(topFan.rows[0])}
                    {topFan.rows[0].hideAmount ? (
                      await displayAmount(topFan.rows[0])
                    ) : (
                      <AmountFigure cents={cents(topFan.rows[0].amountCents)} />
                    )}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <p className="mx-auto max-w-6xl px-6 py-16 text-body text-[var(--text-dim)] md:px-12">
          {await text('home.empty')}
        </p>
      )}
    </main>
  );
}
