import { randomUUID } from 'node:crypto';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { SimulationRibbon } from '@/components/SimulationRibbon';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { Display } from '@/components/primitives/Display';
import { FanCheckoutForm } from '@/components/checkout/FanCheckoutForm';
import {
  AnalyticsEvent,
} from '@/components/analytics/AnalyticsEvent';
import { CheckoutUnavailable } from '@/components/checkout/CheckoutUnavailable';
import type { AmountOption } from '@/components/checkout/AmountChooser';
import {
  getCheckoutSong,
  getOpenCampaigns,
  getTiersFor,
} from '@/lib/checkout/queries';
import { text } from '@/lib/copy/site-copy';
import { setting } from '@/lib/config/settings';
import { cents, formatCents } from '@/lib/money/cents';

export const metadata: Metadata = {
  title: 'Back a Record',
  description:
    'Choose a song, select your support level and become part of the record’s permanent journey.',
};

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{
    song?: string;
    tier?: string;
  }>;
};

export default async function BackPage({
  searchParams,
}: Props) {
  const {
    song: songParam,
    tier: tierParam,
  } = await searchParams;

  const openCampaigns = await getOpenCampaigns();

  const payableCampaigns = openCampaigns.filter(
    (campaign) => campaign.fanSupportEnabled,
  );

  if (payableCampaigns.length === 0) {
    const [emptyLabel, navLabel] = await Promise.all([
      text('checkout.no_open_campaigns'),
      text('nav.cta'),
    ]);

    return (
      <main
        id="main-content"
        className="checkout-v3-page surface-ink min-h-screen"
      >
        <SiteNav sub={navLabel} />

        <section className="site-shell flex min-h-[70vh] items-center py-20">
          <div className="panel w-full p-8 sm:p-12">
            <Display>{emptyLabel}</Display>
          </div>
        </section>

        <SiteFooter />
      </main>
    );
  }

  const selectedCampaign =
    payableCampaigns.find(
      (campaign) => campaign.songSlug === songParam,
    ) ??
    (songParam ? undefined : payableCampaigns[0]);

  if (!selectedCampaign) {
    const requestedSong = songParam
      ? await getCheckoutSong(songParam)
      : null;

    const [
      navLabel,
      eyebrow,
      unavailableTitle,
      unavailableNamed,
      unavailableBody,
      chooseAvailable,
      viewSong,
    ] = await Promise.all([
      text('nav.cta'),
      text('checkout.unavailable.eyebrow'),
      text('checkout.unavailable.title'),
      requestedSong
        ? text('checkout.unavailable.named', {
            song: requestedSong.songTitle,
          })
        : text('checkout.unavailable.title'),
      text('checkout.unavailable.body'),
      text('checkout.unavailable.choose'),
      text('checkout.unavailable.view_song'),
    ]);

    return (
      <main
        id="main-content"
        className="checkout-v3-page surface-ink min-h-screen"
      >
        <SimulationRibbon />
        <SiteNav sub={navLabel} />

        <div className="checkout-v3-shell">
          <CheckoutUnavailable
            song={requestedSong}
            campaigns={payableCampaigns}
            labels={{
              eyebrow,
              title: requestedSong
                ? unavailableNamed
                : unavailableTitle,
              body: unavailableBody,
              choose: chooseAvailable,
              viewSong,
            }}
          />
        </div>

        <SiteFooter />
      </main>
    );
  }


  const tiers = await getTiersFor(
    selectedCampaign.campaignId,
  );

  const options: AmountOption[] = tiers.map((tier) => ({
    id: tier.id,
    label: tier.name,
    amountLabel: formatCents(cents(tier.amountCents)),
    amountCents: tier.amountCents,
    benefits: tier.benefits,
    iconKey: tier.badgeKey,
    note: tier.description,
    disabled: !tier.isAvailable,
  }));

  const [
    locale,
    currency,
    minContributionCents,
    maxContributionCents,
  ] = await Promise.all([
    setting('locale'),
    setting('currency'),
    setting('minContributionCents'),
    setting('maxContributionCents'),
  ]);


  const currencySymbol =
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    })
      .formatToParts(0)
      .find((part) => part.type === 'currency')
      ?.value ?? '';
  const customMin = (
    minContributionCents / 100
  ).toFixed(2);

  const customMax = (
    maxContributionCents / 100
  ).toFixed(2);

  const customRange = await text(
    'checkout.custom_range',
    {
      min: formatCents(
        cents(minContributionCents),
      ),
      max: formatCents(
        cents(maxContributionCents),
      ),
    },
  );

  const initialTierUnavailable = Boolean(
    tierParam &&
      !options.some(
        (option) =>
          option.id === tierParam &&
          !option.disabled,
      ),
  );

  const [
    heading,
    secureBadge,
    chooseSong,
    amount,
    identity,
    payment,
    custom,
    customPlaceholder,
    tierUnavailable,
    tierChanged,
    email,
    displayName,
    instagram,
    city,
    optional,
    anonymous,
    hideAmount,
    consentBody,
    consentCheckbox,
    continueLabel,
    submit,
    working,
    chooseRole,
    fanRole,
    fanRoleSub,
    businessRole,
    businessRoleSub,
    yourSelection,
    tierBenefits,
    secure,
    secureSub,
    stepLabel,
    paymentSecureBody,
    paymentNotConfigured,
    paymentFailed,
    paymentDeclined,
    paymentRetry,
    paymentReturn,
    paymentProcessing,
    paymentDoNotClose,
    paymentSummary,
    paymentRecord,
    paymentSelection,
    paymentAmount,
    viewSong,
  ] = await Promise.all([


    text('checkout.fan.heading'),
    text('checkout.secure_badge'),
    text('checkout.choose_song'),
    text('checkout.step.amount'),
    text('checkout.step.identity'),
    text('checkout.step.payment'),
    text('checkout.custom_amount'),
    text('checkout.custom_placeholder'),
    text('checkout.tier_unavailable'),
    text('checkout.tier_changed'),
    text('checkout.field.email'),
    text('checkout.field.display_name'),
    text('checkout.field.instagram'),
    text('checkout.field.city'),
    text('checkout.field.optional'),
    text('checkout.field.anonymous'),
    text('checkout.field.hide_amount'),
    text('checkout.consent.fan'),
    text('checkout.consent.fan_checkbox'),
    text('checkout.continue.fan'),
    text('checkout.submit.fan'),
    text('checkout.working'),
    text('checkout.choose_role'),
    text('checkout.role.fan'),
    text('checkout.role.fan_sub'),
    text('checkout.role.business'),
    text('checkout.role.business_sub'),
    text('checkout.your_selection'),
    text('checkout.tier_benefits'),
    text('checkout.secure'),
    text('checkout.secure_sub'),
    text('checkout.step_label'),
    text('checkout.payment.secure_body'),
    text('checkout.payment.not_configured'),
    text('checkout.payment.failed'),
    text('checkout.payment.declined'),
    text('checkout.payment.retry'),
    text('checkout.payment.return'),
    text('checkout.payment.processing'),
    text('checkout.payment.do_not_close'),
    text('checkout.payment.summary'),
    text('checkout.payment.record'),
    text('checkout.payment.selection'),
    text('checkout.payment.amount'),
    text('checkout.view_song'),
  ]);


  return (
    <main
      id="main-content"
      className="checkout-v3-page surface-ink min-h-screen"
    >
      <SimulationRibbon />
      <SiteNav sub={heading} />

      <AnalyticsEvent
        kind="checkout_start"
        campaignId={
          selectedCampaign
            .campaignId
        }
        meta={{
          scope: 'fan',
        }}
      />

      <div className="checkout-v3-shell">
        <header
className={[
  'checkout-v3-header',
  'flex flex-wrap items-end justify-between gap-5',
].join(' ')}
        >
          <div>
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-[var(--champagne)]">
              {heading}
            </p>

            <h1
              className={[
                'mt-3 max-w-[18ch]',
                'font-serif text-[clamp(2.25rem,6vw,4.5rem)]',
                'leading-[0.96] tracking-[-0.025em]',
                'text-[var(--text)]',
              ].join(' ')}
            >
              {selectedCampaign.songTitle}
            </h1>

            <Link
              href={
                `/song/${selectedCampaign.songSlug}`
              }
              className={[
                'mt-5 inline-flex min-h-11',
                'items-center',
                'font-ui text-[0.625rem]',
                'font-semibold uppercase',
                'tracking-[0.14em]',
                'text-[var(--text-dim)]',
                'underline decoration-[var(--line-strong)]',
                'underline-offset-4',
                'transition-colors',
                'hover:text-[var(--champagne)]',
                'focus-visible:outline',
                'focus-visible:outline-2',
                'focus-visible:outline-offset-2',
                'focus-visible:outline-[var(--champagne)]',
              ].join(' ')}
            >
              {viewSong}
            </Link>
          </div>

          <p className="flex items-center gap-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-dim)]">
            <ShieldCheck
              aria-hidden
              size={15}
              strokeWidth={1.8}
              color="var(--champagne)"
            />
            {secureBadge}
          </p>
        </header>

        {payableCampaigns.length > 1 ? (
          <nav
            aria-label={chooseSong}
            className="checkout-v3-song-nav"
          >
            <span className="mr-2 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
              {chooseSong}
            </span>

            {payableCampaigns.map((campaign) => {
              const selected =
                campaign.campaignId ===
                selectedCampaign.campaignId;

              return (
                <Link
                  key={campaign.campaignId}
                  href={`/back?song=${campaign.songSlug}`}
                  aria-current={selected ? 'page' : undefined}
                  className={[
                    'rounded-full border px-4 py-2',
                    'text-[0.625rem] font-semibold uppercase',
                    'tracking-[0.12em]',
                    'transition-[color,border-color,background-color]',
                    '[transition-duration:var(--duration-signature)]',
                  ].join(' ')}
                  style={{
                    color: selected
                      ? 'var(--ink)'
                      : 'var(--text-dim)',
                    borderColor: selected
                      ? 'var(--champagne)'
                      : 'var(--line)',
                    background: selected
                      ? 'var(--champagne)'
                      : 'var(--ink-2)',
                  }}
                >
                  {campaign.songTitle}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className="mt-8 sm:mt-10">
          <FanCheckoutForm
            campaignId={
              selectedCampaign.campaignId
            }
            songTitle={
              selectedCampaign.songTitle
            }
            checkoutAttemptKey={
              randomUUID()
            }
            checkoutHref={
              `/back?song=${encodeURIComponent(
                selectedCampaign.songSlug,
              )}`
            }
            options={options}
            currencySymbol={currencySymbol}
            initialTierId={tierParam}
            customMin={customMin}
            customMax={customMax}
            initialTierUnavailable={
              initialTierUnavailable
            }
            labels={{
              amount,
              identity,
              payment,
              custom,
              customPlaceholder,
              customRange,
              tierUnavailable,
              tierChanged,
              email,
              displayName,
              instagram,
              city,
              optional,
              anonymous,
              hideAmount,
              consentBody,
              consentCheckbox,
              continue:
                continueLabel,
              submit,
              working,
              chooseRole,
              fanRole,
              fanRoleSub,
              businessRole,
              businessRoleSub,
              yourSelection,
              tierBenefits,
              secure,
              secureSub,
              stepLabel,
              paymentSecureBody,
              paymentNotConfigured,
              paymentFailed,
              paymentDeclined,
              paymentRetry,
              paymentReturn,
              paymentProcessing,
              paymentDoNotClose,
              paymentSummary,
              paymentRecord,
              paymentSelection,
              paymentAmount,
            }}

            sponsorHref={
              selectedCampaign.businessSponsorshipEnabled
                ? `/song/${selectedCampaign.songSlug}/sponsor`
                : null
            }
          />
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
