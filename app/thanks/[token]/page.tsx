import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { SimulationRibbon } from '@/components/SimulationRibbon';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Display } from '@/components/primitives/Display';
import { ButtonLink } from '@/components/primitives/Button';
import { ShareRow } from '@/components/checkout/ShareRow';
import { resolveThanksToken } from '@/lib/checkout/tokens';
import { rankForIdentity } from '@/lib/checkout/queries';
import { text } from '@/lib/copy/site-copy';
import { cents, formatCents } from '@/lib/money/cents';

export const dynamic = 'force-dynamic';

/** A confirmation page must never be indexed — it names a specific person. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }> };


export default async function ThanksPage({ params }: Props) {
  const { token } = await params;
  const link = await resolveThanksToken(token);
  if (!link?.contributionId) notFound();

  const [contribution] = await db
    .select()
    .from(s.contributions)
    .where(eq(s.contributions.id, link.contributionId))
    .limit(1);
  if (!contribution) notFound();

  const [song] = await db
    .select({ title: s.songs.title, slug: s.songs.slug })
    .from(s.songs)
    .where(eq(s.songs.id, contribution.songId))
    .limit(1);

  // A ledger entry is the only proof that money moved; without one the
  // sponsorship is still under review.
  const [ledger] = await db
    .select({ id: s.ledgerEntries.id })
    .from(s.ledgerEntries)
    .where(eq(s.ledgerEntries.contributionId, contribution.id))
    .limit(1);

  if (!ledger) {
    return (
      <main className="surface-ink min-h-screen">
        <SimulationRibbon />
        <SiteNav />
        <div className="mx-auto w-full max-w-5xl px-6 pt-16 md:px-12 md:pt-24">
          <Eyebrow>{await text('checkout.business.heading')}</Eyebrow>
          <div className="mt-8">
            <Display>{await text('thanks.pending.heading')}</Display>
          </div>
          <p className="mt-8 max-w-[62ch] text-body text-[var(--text-dim)]">
            {await text('thanks.pending.body')}
          </p>
          <div className="mt-12">
            <ButtonLink href={`/song/${song?.slug ?? ''}`} variant="ghost">
              {await text('thanks.view_song')}
            </ButtonLink>
          </div>
        </div>
      </main>
    );
  }

  const numbers = await db
    .select()
    .from(s.supporterNumbers)
    .where(eq(s.supporterNumbers.contributionId, contribution.id));

  const supporterNumber = numbers.find((n) => n.seriesKey === 'supporter')?.number ?? null;
  const foundingNumber = numbers.find((n) => n.seriesKey === 'founding')?.number ?? null;

  const isBusiness = contribution.supportType === 'business';
  const rank = await rankForIdentity(
    contribution.campaignId,
    isBusiness ? 'business' : 'fan',
    isBusiness ? contribution.sponsorId : contribution.supporterId,
  );

  let businessName: string | null = null;
  if (isBusiness && contribution.sponsorId) {
    const [sponsor] = await db
      .select({ businessName: s.sponsors.businessName })
      .from(s.sponsors)
      .where(eq(s.sponsors.id, contribution.sponsorId))
      .limit(1);
    businessName = sponsor?.businessName ?? null;
  }

  const pad = (n: number) => String(n).padStart(4, '0');

  return (
    <main className="surface-ink min-h-screen pb-24">
      <SimulationRibbon />
      <SiteNav sub="SONG JOURNEY" />

      <div className="mx-auto max-w-3xl px-6 py-14 text-center md:py-20">
        <h1 className="font-display text-[clamp(2.25rem,6vw,4.5rem)] uppercase leading-[0.95] text-[var(--text)]">
          {await text('thanks.heading')}
        </h1>

        <p className="mt-5 text-body text-[var(--text-dim)]">
          {isBusiness && businessName
            ? await text('thanks.subhead_business', {
                business: businessName,
                song: song?.title ?? '',
              })
            : await text('thanks.subhead', { song: song?.title ?? '' })}
        </p>

        {/* The number is the keepsake — the mockup lets it carry the page. */}
        {supporterNumber ? (
          <div className="mt-10">
            <p className="font-display text-[clamp(3.5rem,14vw,9rem)] leading-none text-gold">
              #{pad(supporterNumber)}
            </p>
            <div className="mt-4 flex items-center justify-center gap-5">
              <span className="rule-gold h-px w-16 opacity-70" />
              <span className="font-ui text-[0.625rem] uppercase tracking-[0.28em] text-[var(--text-dim)]">
                {foundingNumber
                  ? await text('thanks.founding_number')
                  : await text('thanks.supporter_number')}
              </span>
              <span className="rule-gold h-px w-16 opacity-70" />
            </div>
          </div>
        ) : null}

        {rank ? (
          <div className="mt-9">
            <p className="font-ui text-[0.625rem] uppercase tracking-[0.28em] text-[var(--champagne)]">
              {await text('thanks.rank')}
            </p>
            <p className="mt-2 font-display text-[clamp(2rem,5vw,3rem)] leading-none text-[var(--text)]">
              #{rank}
            </p>
          </div>
        ) : null}

        <p className="mt-8 font-ui text-xs uppercase tracking-[0.2em] text-[var(--text-dim)]">
          {await text('thanks.amount')}{' '}
          <span className="font-mono text-[var(--champagne)]">
            {formatCents(cents(contribution.amountCents))}
          </span>
        </p>

        <div className="mt-12">
          <ShareRow
            shareUrlPath={`/s/${token}`}
            imagePath={`/api/og/thanks/${token}`}
            copyLabel={await text('thanks.copy_link')}
            copiedLabel={await text('thanks.copied')}
            downloadLabel={await text('thanks.download')}
          />
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href={`/song/${song?.slug ?? ''}`} variant="primary" glow className="!rounded-sm">
            {await text('thanks.view_song')}
          </ButtonLink>
          <ButtonLink href="/back" variant="ghost" className="!rounded-sm">
            {await text('thanks.back_another')}
          </ButtonLink>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
