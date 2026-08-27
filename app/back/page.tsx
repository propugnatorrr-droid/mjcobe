import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { SimulationRibbon } from '@/components/SimulationRibbon';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { Display } from '@/components/primitives/Display';
import { FanCheckoutForm } from '@/components/checkout/FanCheckoutForm';
import type { AmountOption } from '@/components/checkout/AmountChooser';
import { getOpenCampaigns, getTiersFor } from '@/lib/checkout/queries';
import { text } from '@/lib/copy/site-copy';
import { setting } from '@/lib/config/settings';
import { cents, formatCents } from '@/lib/money/cents';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ song?: string; tier?: string }> };

export default async function BackPage({ searchParams }: Props) {
  const { song: songParam } = await searchParams;
  const open = await getOpenCampaigns();
  const payable = open.filter((c) => c.fanSupportEnabled);

  if (payable.length === 0) {
    return (
      <main className="surface-ink min-h-screen">
        <SiteNav />
        <div className="flex min-h-[70vh] items-center px-6 md:px-12">
          <div className="mx-auto w-full max-w-5xl">
            <Display>{await text('checkout.no_open_campaigns')}</Display>
          </div>
        </div>
      </main>
    );
  }

  const selected =
    payable.find((c) => c.songSlug === songParam) ??
    (songParam ? undefined : payable[0]);

  if (!selected) notFound();

  const tiers = await getTiersFor(selected.campaignId);
  const options: AmountOption[] = tiers.map((tier) => ({
    id: tier.id,
    label: tier.name,
    amountLabel: formatCents(cents(tier.amountCents)),
    amountCents: tier.amountCents,
    benefits: tier.benefits,
    iconKey: tier.badgeKey,
    note: tier.description,
    disabled: tier.quantityLimit !== null && tier.quantityLimit <= 0,
  }));

  const locale = await setting('locale');
  const currency = await setting('currency');
  const currencySymbol =
    new Intl.NumberFormat(locale, { style: 'currency', currency })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value ?? '';

  return (
    <main className="surface-ink min-h-screen pb-40">
      <SimulationRibbon />
      <SiteNav />

      <div className="mx-auto max-w-[80rem] px-6 pt-10 md:px-10 md:pt-12">
        <div
          className="flex flex-wrap items-center justify-between gap-4 border-b pb-6"
          style={{ borderColor: 'var(--line)' }}
        >
          <div>
            <p className="font-ui text-[0.625rem] uppercase tracking-[0.24em] text-[var(--champagne)]">
              {await text('checkout.fan.heading')}
            </p>
            <h1 className="mt-2 font-serif text-[clamp(1.75rem,4vw,3rem)] leading-tight text-[var(--text)]">
              {selected.songTitle}
            </h1>
          </div>
          <p className="flex items-center gap-2.5 font-ui text-[0.625rem] uppercase tracking-[0.18em] text-[var(--text-dim)]">
            <ShieldCheck aria-hidden size={14} color="var(--champagne)" />
            {await text('checkout.secure_badge')}
          </p>
        </div>

        {payable.length > 1 ? (
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              {await text('checkout.choose_song')}
            </span>
            {payable.map((c) => (
              <Link
                key={c.campaignId}
                href={`/back?song=${c.songSlug}`}
                className="font-mono text-eyebrow uppercase transition-opacity [transition-duration:var(--duration-signature)] hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
                style={{
                  color:
                    c.campaignId === selected.campaignId
                      ? 'var(--text)'
                      : 'var(--text-dim)',
                }}
              >
                {c.songTitle}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-10">
        <FanCheckoutForm
          campaignId={selected.campaignId}
          options={options}
          currencySymbol={currencySymbol}
          labels={{
            amount: await text('checkout.step.amount'),
            identity: await text('checkout.step.identity'),
            payment: await text('checkout.step.payment'),
            custom: await text('checkout.custom_amount'),
            customPlaceholder: await text('checkout.custom_placeholder'),
            email: await text('checkout.field.email'),
            displayName: await text('checkout.field.display_name'),
            instagram: await text('checkout.field.instagram'),
            city: await text('checkout.field.city'),
            optional: await text('checkout.field.optional'),
            anonymous: await text('checkout.field.anonymous'),
            hideAmount: await text('checkout.field.hide_amount'),
            consentBody: await text('checkout.consent.fan'),
            consentCheckbox: await text('checkout.consent.fan_checkbox'),
            submit: await text('checkout.submit.fan'),
            working: await text('checkout.working'),
            chooseRole: await text('checkout.choose_role'),
            fanRole: await text('checkout.role.fan'),
            fanRoleSub: await text('checkout.role.fan_sub'),
            businessRole: await text('checkout.role.business'),
            businessRoleSub: await text('checkout.role.business_sub'),
            yourSelection: await text('checkout.your_selection'),
            tierBenefits: await text('checkout.tier_benefits'),
            secure: await text('checkout.secure'),
            secureSub: await text('checkout.secure_sub'),
          }}
          sponsorHref={`/song/${selected.songSlug}/sponsor`}
        />
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
