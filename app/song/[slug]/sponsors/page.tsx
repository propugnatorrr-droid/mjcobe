import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Medal } from 'lucide-react';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileCta } from '@/components/MobileCta';
import { SponsorChallenge } from '@/components/sponsor/SponsorChallenge';
import { SponsorLogo } from '@/components/sponsor/SponsorLogo';
import { PresentingPartner } from '@/components/sponsor/PresentingPartner';
import { getSongPage } from '@/lib/song/queries';
import {
  getLeaderboard,
  getTopSpot,
} from '@/lib/campaign/queries';
import { text } from '@/lib/copy/site-copy';
import { cents, formatCents } from '@/lib/money/cents';

export const revalidate = 60;

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSongPage(slug);

  if (!data) {
    return {};
  }

  return {
    title: `Official Partners — ${data.song.title} | MJ COBE`,
    description: `Meet the official businesses backing ${data.song.title} by MJ COBE.`,
  };
}

const MEDAL_COLORS: Record<number, string> = {
  2: '#b9c0c7',
  3: '#b0754a',
};

export default async function AllSponsorsPage({
  params,
}: Props) {
  const { slug } = await params;
  const data = await getSongPage(slug);

  if (!data?.campaign) {
    notFound();
  }

  const [
    leaderboard,
    topSpot,
    heading,
    hiddenLabel,
    emptyLabel,
    presentingLabel,
    contributedLabel,
    visitLabel,
    challengeHeading,
    currentNumberOne,
    minimumToClaim,
    numberOneOpen,
    challengeBody,
    claimLabel,
    allPartnersLabel,
   officialPartnersBody,
  ] = await Promise.all([
    getLeaderboard(data.campaign.id, 'business'),
    getTopSpot(data.campaign.id, 'business'),
    text('leaderboard.business_heading'),
    text('song.amount_hidden'),
    text('song.empty.partners'),
    text('partner.presenting'),
    text('partner.contributed'),
    text('partner.visit'),
    text('partner.challenge_heading'),
    text('partner.current_number_one'),
    text('partner.minimum_to_claim'),
    text('partner.number_one_open'),
    text('partner.challenge_body'),
    text('partner.claim_number_one'),
    text('partner.all_partners'),
    text('partner.official_partners_body'),
  ]);

  const [presentingPartner, ...rankedPartners] =
    leaderboard.rows;

  const canSponsor =
    data.isAcceptingSupport &&
    data.campaign.businessSponsorshipEnabled;

  return (
    <main className="surface-ink min-h-screen pb-28 md:pb-0">
      <SiteNav sub="PARTNERS" />

      <section className="border-b border-[var(--line)]">
        <div className="site-shell py-12 sm:py-16 lg:py-20">
          <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-[var(--champagne)]">
            {data.song.title}
          </p>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-[clamp(3rem,8vw,7.5rem)] uppercase leading-[0.88] text-[var(--text)]">
                {heading}
              </h1>

              <p className="mt-5 max-w-[58ch] text-sm leading-6 text-[var(--text-dim)] sm:text-base">
                {officialPartnersBody}
              </p>
            </div>

            {canSponsor ? (
              <Link
                href={`/song/${slug}/sponsor`}
                className={[
                  'inline-flex min-h-12 shrink-0 items-center justify-center gap-2',
                  'rounded-full border border-[var(--line-strong)]',
                  'px-6 py-3',
                  'font-ui text-[0.6875rem] font-semibold uppercase',
                  'tracking-[0.14em] text-[var(--text)]',
                  'transition-colors',
                  '[transition-duration:var(--duration-signature)]',
                  'hover:border-[var(--champagne)]',
                  'hover:text-[var(--champagne)]',
                ].join(' ')}
              >
                {await text('button.sponsor_this_song')}
                <ArrowUpRight aria-hidden size={15} />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <div className="site-shell py-10 sm:py-14 lg:py-20">
        {presentingPartner ? (
          <PresentingPartner
            name={presentingPartner.name}
            amount={formatCents(
              cents(presentingPartner.amountCents),
            )}
            amountHidden={presentingPartner.hideAmount}
            hiddenLabel={hiddenLabel}
            logoPath={presentingPartner.logoPath}
            profileHref={
              presentingPartner.slug
                ? `/partner/${presentingPartner.slug}`
                : null
            }
            presentingLabel={presentingLabel}
            contributedLabel={contributedLabel}
            visitLabel={visitLabel}
          />
        ) : (
          <div
            className={[
              'rounded-[var(--radius-panel)]',
              'border border-[var(--line)]',
              'bg-[var(--ink-2)] p-8',
            ].join(' ')}
          >
            <p className="max-w-[52ch] text-sm leading-6 text-[var(--text-dim)] sm:text-base">
              {emptyLabel}
            </p>
          </div>
        )}

        {rankedPartners.length > 0 ? (
          <section
            aria-labelledby="ranked-partners-heading"
            className="mt-12 lg:mt-16"
          >
            <div className="flex items-center gap-4">
              <span className="h-px flex-1 bg-[var(--line)]" />

              <h2
                id="ranked-partners-heading"
                className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]"
              >
                {allPartnersLabel}
              </h2>

              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>

            <div className="mt-6 overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--ink-2)]">
              {rankedPartners.map((partner) => {
                const medalColor =
                  MEDAL_COLORS[partner.rank];

                return (
                  <article
                    key={partner.id}
                    className={[
                      'grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4',
                      'border-b border-[var(--line)] px-4 py-5',
                      'last:border-b-0',
                      'sm:grid-cols-[3rem_auto_minmax(0,1fr)_auto]',
                      'sm:gap-5 sm:px-6',
                    ].join(' ')}
                  >
                    <div className="hidden sm:flex sm:justify-center">
                      {medalColor ? (
                        <Medal
                          aria-label={`Rank ${partner.rank}`}
                          size={21}
                          strokeWidth={1.7}
                          color={medalColor}
                        />
                      ) : (
                        <span className="numeric font-ui text-xs text-[var(--text-dim)]">
                          {partner.rank}
                        </span>
                      )}
                    </div>

                    <SponsorLogo
                      name={partner.name}
                      src={partner.logoPath}
                      size="small"
                    />

                    <div className="min-w-0">
                      <p className="font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)] sm:hidden">
                        #{partner.rank}
                      </p>

                      <h3 className="mt-1 truncate font-serif text-xl text-[var(--text)] sm:mt-0 sm:text-2xl">
                        {partner.name}
                      </h3>

                      <p className="numeric mt-1 font-serif text-lg text-gold sm:hidden">
                        {partner.hideAmount
                          ? hiddenLabel
                          : formatCents(
                              cents(partner.amountCents),
                            )}
                      </p>
                    </div>

                    <div className="col-span-2 flex items-center justify-between gap-4 border-t border-[var(--line)] pt-4 sm:col-span-1 sm:border-0 sm:pt-0">
                      <p className="numeric hidden whitespace-nowrap font-serif text-2xl text-gold sm:block">
                        {partner.hideAmount
                          ? hiddenLabel
                          : formatCents(
                              cents(partner.amountCents),
                            )}
                      </p>

                      {partner.slug ? (
                        <Link
                          href={`/partner/${partner.slug}`}
                          aria-label={`${visitLabel}: ${partner.name}`}
                          className={[
                            'ml-auto inline-flex h-11 w-11 items-center justify-center',
                            'rounded-full border border-[var(--line)]',
                            'text-[var(--text-dim)]',
                            'transition-colors',
                            '[transition-duration:var(--duration-signature)]',
                            'hover:border-[var(--champagne)]',
                            'hover:text-[var(--champagne)]',
                          ].join(' ')}
                        >
                          <ArrowUpRight
                            aria-hidden
                            size={16}
                          />
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {canSponsor ? (
          <div className="mt-12 lg:mt-16">
            <SponsorChallenge
              songSlug={slug}
              leaderName={topSpot.leader?.name}
              leaderAmount={
                topSpot.leader
                  ? formatCents(
                      cents(topSpot.leader.amountCents),
                    )
                  : null
              }
              minimumAmount={formatCents(
                cents(topSpot.minimumToLeadCents),
              )}
              heading={challengeHeading}
              currentLabel={currentNumberOne}
              minimumLabel={minimumToClaim}
              openLabel={numberOneOpen}
              body={challengeBody}
              actionLabel={claimLabel}
            />
          </div>
        ) : null}
      </div>

      <SiteFooter />
      <MobileCta />
    </main>
  );
}
