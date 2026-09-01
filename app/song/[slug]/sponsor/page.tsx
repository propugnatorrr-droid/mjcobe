import { randomUUID } from 'node:crypto';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SimulationRibbon } from '@/components/SimulationRibbon';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { SponsorForm } from '@/components/checkout/SponsorForm';
import {
  AnalyticsEvent,
} from '@/components/analytics/AnalyticsEvent';
import type { AmountOption } from '@/components/checkout/AmountChooser';
import { getSongPage } from '@/lib/song/queries';
import { getPackagesFor } from '@/lib/checkout/queries';
import {
  resolveSponsorPackageId,
  sponsorCheckoutHref,
} from '@/lib/checkout/sponsor-selection';
import { getTopSpot } from '@/lib/campaign/queries';
import { text } from '@/lib/copy/site-copy';
import { setting } from '@/lib/config/settings';
import {
  cents,
  formatCents,
} from '@/lib/money/cents';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    claim?: string;
    package?: string;
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
    title: `Sponsor ${data.song.title} | MJ COBE`,
    description: `Put your business behind the campaign for ${data.song.title} by MJ COBE.`,
  };
}

function amountInputValue(amountCents: number): string {
  const amount = amountCents / 100;

  return Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2);
}

export default async function SponsorPage({
  params,
  searchParams,
}: Props) {
  const [{ slug }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  const data = await getSongPage(slug);

  if (!data?.campaign) {
    notFound();
  }

  if (
    !data.isAcceptingSupport ||
    !data.campaign.businessSponsorshipEnabled
  ) {
    notFound();
  }

  const claimTop = query.claim === '1';

  const [packages, topSpot, locale, currency] =
    await Promise.all([
      getPackagesFor(data.campaign.id),
      getTopSpot(data.campaign.id, 'business'),
      setting('locale'),
      setting('currency'),
    ]);

  const options: AmountOption[] = packages.map(
    (pkg) => ({
      id: pkg.id,
      label: pkg.name,
      amountLabel: formatCents(
        cents(pkg.priceCents),
      ),
      amountCents: pkg.priceCents,
      note: pkg.deliverables[0] ?? null,
      benefits: pkg.deliverables,
      iconKey: pkg.name
        .toLowerCase()
        .includes('digital')
        ? 'digital'
        : pkg.name
              .toLowerCase()
              .includes('featured')
          ? 'featured'
          : pkg.name
                .toLowerCase()
                .includes('visual')
            ? 'visual'
            : pkg.name
                  .toLowerCase()
                  .includes('presenting')
              ? 'presenting'
              : null,
    }),
  );
  const initialPackageId =
    resolveSponsorPackageId(
      query.package,
      options.map(
        (option) => option.id,
      ),
      claimTop,
    );

  const checkoutHref =
    sponsorCheckoutHref(
      data.song.slug,
      {
        packageId:
          initialPackageId,
        claimTop,
      },
    );

  const currencySymbol =
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    })
      .formatToParts(0)
      .find(
        (part) => part.type === 'currency',
      )?.value ?? '';

  const threshold =
    data.campaign.sponsorApprovalThresholdCents ??
    (await setting(
      'sponsorApprovalThresholdCents',
    ));

  const minimumToLeadLabel = formatCents(
    cents(topSpot.minimumToLeadCents),
  );

  return (
    <main className="sponsor-v3-page surface-ink min-h-screen">
      <SimulationRibbon />
      <SiteNav sub="BUSINESS SPONSORSHIP" />

      <AnalyticsEvent
        kind="checkout_start"
        songId={data.song.id}
        campaignId={
          data.campaign.id
        }
        meta={{
          scope:
            'business',
        }}
      />

      <section className="sponsor-v3-hero relative overflow-hidden border-b border-[var(--line)]">
        <div
          aria-hidden
          className={[
            'pointer-events-none absolute inset-0',
            'bg-[radial-gradient(circle_at_50%_0%,rgba(201,162,39,0.12),transparent_52%)]',
          ].join(' ')}
        />

        <div className="site-shell relative py-12 text-center sm:py-16 lg:py-20">
          <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-[var(--champagne)]">
            {data.song.title}
          </p>

          <h1 className="mx-auto mt-4 max-w-5xl font-display text-[clamp(3rem,8vw,7rem)] uppercase leading-[0.88] text-[var(--text)]">
            {claimTop
              ? await text(
                  'checkout.business.claim_heading',
                )
              : await text(
                  'checkout.business.heading',
                )}
          </h1>

          <p className="mx-auto mt-5 max-w-[58ch] text-sm leading-6 text-[var(--text-dim)] sm:text-base">
            {await text(
              'checkout.business.subheading',
            )}
          </p>

          {topSpot.leader ? (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                {await text(
                  'partner.current_number_one',
                )}
              </span>

              <span className="font-serif text-xl text-[var(--text)]">
                {topSpot.leader.name}
              </span>

              <span className="numeric font-serif text-xl text-gold">
                {formatCents(
                  cents(topSpot.leader.amountCents),
                )}
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <div className="site-shell py-10 sm:py-14 lg:py-16">
        <SponsorForm
          campaignId={data.campaign.id}
          songTitle={data.song.title}
          checkoutHref={checkoutHref}
          initialPackageId={
            initialPackageId
          }
          checkoutAttemptKey={randomUUID()}
          options={options}
          currencySymbol={currencySymbol}
          claimTop={claimTop}
          minimumToLeadInput={amountInputValue(
            topSpot.minimumToLeadCents,
          )}
          minimumToLeadLabel={
            minimumToLeadLabel
          }
          approvalNote={
            data.campaign.sponsorAutoApprove
              ? null
              : await text(
                  'checkout.approval_note',
                  {
                    amount: formatCents(
                      cents(threshold),
                    ),
                  },
                )
          }
          labels={{
            packages: await text(
              'checkout.packages',
            ),
            business: await text(
              'checkout.step.business',
            ),
            payment: await text(
              'checkout.step.payment',
            ),
            custom: await text(
              'checkout.custom_amount',
            ),
            customPlaceholder: await text(
              'checkout.custom_placeholder',
            ),
            businessName: await text(
              'checkout.field.business_name',
            ),
            repName: await text(
              'checkout.field.rep_name',
            ),
            email: await text(
              'checkout.field.email',
            ),
            phone: await text(
              'checkout.field.phone',
            ),
            website: await text(
              'checkout.field.website',
            ),
            instagram: await text(
              'checkout.field.instagram',
            ),
            industry: await text(
              'checkout.field.industry',
            ),
            message: await text(
              'checkout.field.message',
            ),
            optional: await text(
              'checkout.field.optional',
            ),
            logo: await text(
              'checkout.field.logo',
            ),
            logoHelp: await text(
              'checkout.logo.help',
            ),
            logoChoose: await text(
              'checkout.logo.choose',
            ),
            logoRemove: await text(
              'checkout.logo.remove',
            ),
            consentBody: await text(
              'checkout.consent.business',
            ),
            consentCheckbox: await text(
              'checkout.consent.business_checkbox',
            ),
            continue: await text(
              'checkout.continue.business',
            ),
            paymentSubmit: await text(
              'checkout.submit.business',
            ),
            working: await text(
              'checkout.working',
            ),
            summary: await text(
              'checkout.summary',
            ),
            selectedPackage: await text(
              'checkout.package.includes',
            ),
            customSponsorship: await text(
              'checkout.custom_sponsorship',
            ),
            approvalHeading: await text(
              'checkout.approval_heading',
            ),
            claimHeading: await text(
              'checkout.business.claim_heading',
            ),
            claimBody: await text(
              'checkout.business.claim_body',
            ),
            paymentSecureBody: await text(
              'checkout.payment.secure_body',
            ),
            paymentNotConfigured: await text(
              'checkout.payment.not_configured',
            ),
            paymentFailed: await text(
              'checkout.payment.failed',
            ),
            paymentDeclined: await text(
              'checkout.payment.declined',
            ),
            paymentRetry: await text(
              'checkout.payment.retry',
            ),
            paymentReturn: await text(
              'checkout.payment.return',
            ),
            paymentProcessing: await text(
              'checkout.payment.processing',
            ),
            paymentDoNotClose: await text(
              'checkout.payment.do_not_close',
            ),
            paymentSummary: await text(
              'checkout.payment.summary',
            ),
            paymentRecord: await text(
              'checkout.payment.record',
            ),
paymentSelection: await text(
  'checkout.package.includes',
),
            paymentAmount: await text(
              'checkout.payment.amount',
            ),
          }}
        />
      </div>

      <SiteFooter />
    </main>
  );
}
