import { notFound } from 'next/navigation';
import { SimulationRibbon } from '@/components/SimulationRibbon';
import { SiteNav } from '@/components/SiteNav';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Display } from '@/components/primitives/Display';
import { Rule } from '@/components/primitives/Rule';
import { SponsorForm } from '@/components/checkout/SponsorForm';
import type { AmountOption } from '@/components/checkout/AmountChooser';
import { getSongPage } from '@/lib/song/queries';
import { getPackagesFor } from '@/lib/checkout/queries';
import { text } from '@/lib/copy/site-copy';
import { setting } from '@/lib/config/settings';
import { cents, formatCents } from '@/lib/money/cents';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export default async function SponsorPage({ params }: Props) {
  const { slug } = await params;
  const data = await getSongPage(slug);
  if (!data?.campaign) notFound();
  if (!data.isAcceptingSupport || !data.campaign.businessSponsorshipEnabled) notFound();

  const packages = await getPackagesFor(data.campaign.id);
  const options: AmountOption[] = packages.map((pkg) => ({
    id: pkg.id,
    label: pkg.name,
    amountLabel: formatCents(cents(pkg.priceCents)),
    amountCents: pkg.priceCents,
    note: pkg.deliverables[0] ?? null,
    benefits: pkg.deliverables,
    iconKey: pkg.name.toLowerCase().includes('digital') ? 'digital'
      : pkg.name.toLowerCase().includes('featured') ? 'featured'
      : pkg.name.toLowerCase().includes('visual') ? 'visual'
      : pkg.name.toLowerCase().includes('presenting') ? 'presenting'
      : null,
  }));

  const locale = await setting('locale');
  const currency = await setting('currency');
  const currencySymbol =
    new Intl.NumberFormat(locale, { style: 'currency', currency })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value ?? '';

  const threshold =
    data.campaign.sponsorApprovalThresholdCents ??
    (await setting('sponsorApprovalThresholdCents'));

  return (
    <main className="surface-ink min-h-screen pb-40">
      <SimulationRibbon />
      <SiteNav />

      <div className="mx-auto max-w-3xl px-6 pt-16 md:px-12 md:pt-24">
        <Eyebrow>{await text('checkout.business.heading')}</Eyebrow>
        <div className="mt-8">
          <Display>{data.song.title}</Display>
        </div>

        {data.crown?.leader ? (
          <p className="mt-10 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {await text('checkout.minimum_to_lead', {
              amount: formatCents(cents(data.crown.minimumToLeadCents)),
            })}
          </p>
        ) : null}

        <div className="my-16">
          <Rule />
        </div>

        <SponsorForm
          campaignId={data.campaign.id}
          options={options}
          currencySymbol={currencySymbol}
          approvalNote={
            data.campaign.sponsorAutoApprove
              ? null
              : await text('checkout.approval_note', {
                  amount: formatCents(cents(threshold)),
                })
          }
          labels={{
            amount: await text('checkout.packages'),
            business: await text('checkout.step.business'),
            payment: await text('checkout.step.payment'),
            custom: await text('checkout.custom_amount'),
            customPlaceholder: await text('checkout.custom_placeholder'),
            businessName: await text('checkout.field.business_name'),
            repName: await text('checkout.field.rep_name'),
            email: await text('checkout.field.email'),
            phone: await text('checkout.field.phone'),
            website: await text('checkout.field.website'),
            instagram: await text('checkout.field.instagram'),
            industry: await text('checkout.field.industry'),
            message: await text('checkout.field.message'),
            optional: await text('checkout.field.optional'),
            consentBody: await text('checkout.consent.business'),
            consentCheckbox: await text('checkout.consent.business_checkbox'),
            submit: await text('checkout.submit.business'),
            working: await text('checkout.working'),
          }}
        />
      </div>
    </main>
  );
}
