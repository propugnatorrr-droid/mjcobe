import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { SimulationRibbon } from '@/components/SimulationRibbon';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { Display } from '@/components/primitives/Display';
import { FanCheckoutForm } from '@/components/checkout/FanCheckoutForm';
import type { AmountOption } from '@/components/checkout/AmountChooser';
import {
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
        className="surface-ink min-h-screen"
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
    notFound();
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

  const [locale, currency] = await Promise.all([
    setting('locale'),
    setting('currency'),
  ]);

  const currencySymbol =
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    })
      .formatToParts(0)
      .find((part) => part.type === 'currency')
      ?.value ?? '';

  const [
    heading,
    secureBadge,
    chooseSong,
    amount,
    identity,
    payment,
    custom,
    customPlaceholder,
    email,
    displayName,
    instagram,
    city,
    optional,
    anonymous,
    hideAmount,
    consentBody,
    consentCheckbox,
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
  ] = await Promise.all([
    text('checkout.fan.heading'),
    text('checkout.secure_badge'),
    text('checkout.choose_song'),
    text('checkout.step.amount'),
    text('checkout.step.identity'),
    text('checkout.step.payment'),
    text('checkout.custom_amount'),
    text('checkout.custom_placeholder'),
    text('checkout.field.email'),
    text('checkout.field.display_name'),
    text('checkout.field.instagram'),
    text('checkout.field.city'),
    text('checkout.field.optional'),
    text('checkout.field.anonymous'),
    text('checkout.field.hide_amount'),
    text('checkout.consent.fan'),
    text('checkout.consent.fan_checkbox'),
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
  ]);

  return (
    <main
      id="main-content"
      className="surface-ink min-h-screen"
    >
      <SimulationRibbon />
      <SiteNav sub={heading} />

      <div className="site-shell-standard pb-20 pt-8 sm:pt-10 lg:pt-12">
        <header
          className={[
            'flex flex-wrap items-end justify-between gap-5',
            'border-b border-[var(--line)] pb-7',
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
            className="mt-7 flex flex-wrap items-center gap-3"
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
            campaignId={selectedCampaign.campaignId}
            options={options}
            currencySymbol={currencySymbol}
            initialTierId={tierParam}
            labels={{
              amount,
              identity,
              payment,
              custom,
              customPlaceholder,
              email,
              displayName,
              instagram,
              city,
              optional,
              anonymous,
              hideAmount,
              consentBody,
              consentCheckbox,
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
