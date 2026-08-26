import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { SimulationRibbon } from '@/components/SimulationRibbon';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Display } from '@/components/primitives/Display';
import { Rule } from '@/components/primitives/Rule';
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

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{label}</span>
      <span className="font-mono text-3xl text-[var(--text)] md:text-4xl">{children}</span>
    </div>
  );
}

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
      <main className="surface-ink flex min-h-screen items-center px-6 md:px-12">
        <div className="mx-auto w-full max-w-5xl">
          <SimulationRibbon />
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
    <main className="surface-ink min-h-screen pb-40">
      <SimulationRibbon />

      <div className="mx-auto max-w-3xl px-6 pt-24 md:px-12 md:pt-40">
        <Display>{await text('thanks.heading')}</Display>

        <p className="mt-8 max-w-[62ch] text-body text-[var(--text-dim)]">
          {isBusiness && businessName
            ? await text('thanks.subhead_business', {
                business: businessName,
                song: song?.title ?? '',
              })
            : await text('thanks.subhead', { song: song?.title ?? '' })}
        </p>

        <div className="my-16">
          <Rule />
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-12">
          <Stat label={await text('thanks.amount')}>
            {formatCents(cents(contribution.amountCents))}
          </Stat>
          {rank ? (
            <Stat label={await text('thanks.rank')}>#{rank}</Stat>
          ) : null}
          {supporterNumber ? (
            <Stat label={await text('thanks.supporter_number')}>#{pad(supporterNumber)}</Stat>
          ) : null}
          {foundingNumber ? (
            <Stat label={await text('thanks.founding_number')}>#{pad(foundingNumber)}</Stat>
          ) : null}
        </div>

        <div className="my-16">
          <Rule />
        </div>

        <ShareRow
          shareUrlPath={`/s/${token}`}
          imagePath={`/api/og/thanks/${token}`}
          copyLabel={await text('thanks.copy_link')}
          copiedLabel={await text('thanks.copied')}
          downloadLabel={await text('thanks.download')}
        />

        <div className="mt-12 flex flex-wrap gap-4">
          <ButtonLink href={`/song/${song?.slug ?? ''}`} variant="primary">
            {await text('thanks.view_song')}
          </ButtonLink>
          <ButtonLink href="/back" variant="ghost">
            {await text('thanks.back_another')}
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
