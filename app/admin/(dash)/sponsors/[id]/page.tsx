import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
} from 'lucide-react';
import {
  getAdminSponsor,
} from '@/lib/admin/queries';
import {
  getSponsorContracts,
} from '@/lib/admin/contracts';
import {
  approveSponsorLogo,
  moderateSponsorVisibility,
  rejectSponsorLogo,
  updateSponsorProfile,
  uploadSponsorLogo,
} from '@/lib/admin/actions';
import {
  AdminHeading,
  AdminHint,
} from '@/components/admin/ui';
import {
  SponsorLogo,
} from '@/components/sponsor/SponsorLogo';
import {
  SponsorContractPanel,
} from '@/components/admin/SponsorContractPanel';
import { admin } from '@/lib/copy/admin';
import {
  cents,
  formatCents,
} from '@/lib/money/cents';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function Input({
  label,
  name,
  defaultValue,
  type = 'text',
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
        {label}
      </span>

      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        className={[
          'mt-2 min-h-12 w-full',
          'rounded-[var(--radius-panel)]',
          'border border-[var(--line)]',
          'bg-[var(--ink)] px-4',
          'text-sm text-[var(--text)]',
          'focus:border-[var(--champagne)]',
          'focus:outline-none',
        ].join(' ')}
      />
    </label>
  );
}

export default async function SponsorEditorPage({
  params,
}: Props) {
  const { id } = await params;
  const [
    sponsor,
    contractData,
  ] = await Promise.all([
    getAdminSponsor(id),
    getSponsorContracts(id),
  ]);

  if (!sponsor) {
    notFound();
  }

  return (
    <>
      <Link
        href="/admin/sponsors/manage"
        className="inline-flex items-center gap-2 font-ui text-[0.625rem] uppercase tracking-[0.16em] text-[var(--text-dim)] hover:text-[var(--champagne)]"
      >
        <ArrowLeft
          aria-hidden
          size={14}
        />
        {admin.sponsors.directory}
      </Link>

      <div className="mt-7 flex flex-wrap items-start justify-between gap-6">
        <div>
          <AdminHeading>
            {admin.sponsors.profile}
          </AdminHeading>

          <AdminHint>
            {admin.sponsors.profileHint}
          </AdminHint>
        </div>

        {sponsor.moderation ===
        'approved' ? (
          <Link
            href={`/partner/${sponsor.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[var(--champagne)]"
          >
            {admin.actions.preview}
            <ArrowUpRight
              aria-hidden
              size={14}
            />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <form
          action={updateSponsorProfile}
          className={[
            'rounded-[var(--radius-panel)]',
            'border border-[var(--line)]',
            'bg-[var(--ink-2)] p-6',
          ].join(' ')}
        >
          <input
            type="hidden"
            name="sponsorId"
            value={sponsor.id}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label={
                admin.sponsors.businessName
              }
              name="businessName"
              defaultValue={
                sponsor.businessName
              }
            />

            <Input
              label={admin.sponsors.contact}
              name="repName"
              defaultValue={sponsor.repName}
            />

            <Input
              label={admin.email}
              name="email"
              type="email"
              defaultValue={sponsor.email}
            />

            <Input
              label={admin.sponsors.phone}
              name="phone"
              type="tel"
              defaultValue={sponsor.phone}
            />

            <Input
              label={admin.sponsors.website}
              name="website"
              type="url"
              defaultValue={sponsor.website}
            />

            <Input
              label={admin.sponsors.instagram}
              name="instagram"
              defaultValue={sponsor.instagram}
            />

            <Input
              label={admin.sponsors.shopUrl}
              name="shopUrl"
              type="url"
              defaultValue={sponsor.shopUrl}
            />

            <Input
              label={admin.sponsors.industry}
              name="industry"
              defaultValue={sponsor.industry}
            />
          </div>

          <label className="mt-5 block">
            <span className="font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
              {admin.sponsors.description}
            </span>

            <textarea
              name="description"
              rows={7}
              defaultValue={
                sponsor.description ?? ''
              }
              className={[
                'mt-2 w-full resize-y',
                'rounded-[var(--radius-panel)]',
                'border border-[var(--line)]',
                'bg-[var(--ink)] p-4',
                'text-sm leading-6',
                'text-[var(--text)]',
                'focus:border-[var(--champagne)]',
                'focus:outline-none',
              ].join(' ')}
            />
          </label>

          <button
            type="submit"
            className={[
              'bg-gold mt-6 inline-flex',
              'min-h-12 items-center',
              'justify-center rounded-full',
              'px-7 py-3',
              'font-ui text-[0.625rem]',
              'font-semibold uppercase',
              'tracking-[0.16em]',
              'text-[var(--ink)]',
              'hover:brightness-110',
            ].join(' ')}
          >
            {admin.sponsors.saveProfile}
          </button>
        </form>

        <aside className="h-fit rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--ink-2)] p-6">
<div>
  <p className="mb-3 font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
    {admin.sponsors.approvedLogo}
  </p>

  <SponsorLogo
    name={sponsor.businessName}
    src={sponsor.logoPath}
    size="large"
  />
</div>

<form
  action={uploadSponsorLogo}
  encType="multipart/form-data"
  className="mt-6 border-t border-[var(--line)] pt-6"
>
  <input
    type="hidden"
    name="sponsorId"
    value={sponsor.id}
  />

  <label className="block">
    <span className="font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
      {admin.sponsors.uploadLogo}
    </span>

    <input
      name="logo"
      type="file"
      accept="image/png,image/webp"
      required
      className={[
        'mt-3 block w-full text-xs',
        'text-[var(--text-dim)]',
        'file:mr-3 file:rounded-full',
        'file:border file:border-[var(--line)]',
        'file:bg-[var(--ink)]',
        'file:px-4 file:py-2',
        'file:font-ui file:text-[0.5625rem]',
        'file:font-semibold file:uppercase',
        'file:tracking-[0.14em]',
        'file:text-[var(--text)]',
      ].join(' ')}
    />
  </label>

  <p className="mt-3 text-xs leading-5 text-[var(--text-faint)]">
    {admin.sponsors.logoRequirements}
  </p>

  <button
    type="submit"
    className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] px-5 py-2 font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text)] hover:border-[var(--champagne)] hover:text-[var(--champagne)]"
  >
    {admin.sponsors.chooseLogo}
  </button>
</form>

{sponsor.pendingLogoPath &&
sponsor.pendingLogoAssetId ? (
  <section className="mt-6 border-t border-[var(--line)] pt-6">
    <p className="font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-[var(--champagne)]">
      {admin.sponsors.pendingLogo}
    </p>

    <p className="mt-2 text-xs leading-5 text-[var(--text-dim)]">
      {admin.sponsors.pendingLogoHint}
    </p>

    <div className="mt-4">
      <SponsorLogo
        name={sponsor.businessName}
        src={sponsor.pendingLogoPath}
        size="large"
      />
    </div>

    <div className="mt-5 flex flex-wrap gap-3">
      <form action={approveSponsorLogo}>
        <input
          type="hidden"
          name="sponsorId"
          value={sponsor.id}
        />
        <input
          type="hidden"
          name="assetId"
          value={
            sponsor.pendingLogoAssetId
          }
        />

        <button
          type="submit"
          className="bg-gold inline-flex min-h-10 items-center justify-center rounded-full px-5 py-2 font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink)] hover:brightness-110"
        >
          {admin.sponsors.approveLogo}
        </button>
      </form>

      <form action={rejectSponsorLogo}>
        <input
          type="hidden"
          name="sponsorId"
          value={sponsor.id}
        />
        <input
          type="hidden"
          name="assetId"
          value={
            sponsor.pendingLogoAssetId
          }
        />

        <button
          type="submit"
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--status-danger)] px-5 py-2 font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-[var(--status-danger)] hover:bg-[rgba(142,29,34,0.1)]"
        >
          {admin.sponsors.rejectLogo}
        </button>
      </form>
    </div>
  </section>
) : null}


          <dl className="mt-6 grid gap-5">
            <div>
              <dt className="font-ui text-[0.5625rem] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                {admin.sponsors.publicStatus}
              </dt>

              <dd className="mt-1 font-ui text-sm uppercase text-[var(--text)]">
                {sponsor.moderation}
              </dd>
            </div>

            <div>
              <dt className="font-ui text-[0.5625rem] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                {admin.sponsors.totalBacked}
              </dt>

              <dd className="numeric mt-1 font-serif text-3xl text-gold">
                {formatCents(
                  cents(sponsor.netCents),
                )}
              </dd>
            </div>

            <div>
              <dt className="font-ui text-[0.5625rem] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                {admin.sponsors.contributions}
              </dt>

              <dd className="mt-1 font-serif text-2xl text-[var(--text)]">
                {sponsor.contributionCount}
              </dd>
            </div>
          </dl>

          {sponsor.moderation ===
            'approved' ||
          sponsor.moderation ===
            'hidden' ? (
            <form
              action={
                moderateSponsorVisibility
              }
              className="mt-7 border-t border-[var(--line)] pt-6"
            >
              <input
                type="hidden"
                name="sponsorId"
                value={sponsor.id}
              />
              <input
                type="hidden"
                name="action"
                value={
                  sponsor.moderation ===
                  'approved'
                    ? 'hide'
                    : 'show'
                }
              />

              <button
                type="submit"
                className={[
                  'inline-flex min-h-11 w-full',
                  'items-center justify-center',
                  'rounded-full border',
                  'border-[var(--line)]',
                  'px-5 py-3',
                  'font-ui text-[0.625rem]',
                  'font-semibold uppercase',
                  'tracking-[0.14em]',
                  'text-[var(--text-dim)]',
                  'hover:border-[var(--champagne)]',
                  'hover:text-[var(--champagne)]',
                ].join(' ')}
              >
                {sponsor.moderation ===
                'approved'
                  ? admin.sponsors.hideProfile
                  : admin.sponsors.showProfile}
              </button>
            </form>
          ) : null}
        </aside>
      </div>

      <SponsorContractPanel
        sponsorId={sponsor.id}
        contracts={
          contractData.contracts
        }
        campaigns={
          contractData.campaigns
        }
      />
    </>
  );
}
