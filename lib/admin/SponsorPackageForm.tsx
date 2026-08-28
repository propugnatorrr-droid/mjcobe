'use client';

import {
  useActionState,
} from 'react';
import {
  createSponsorPackage,
  updateSponsorPackage,
  type SponsorPackageAdminState,
} from '@/lib/admin/sponsor-package-actions';
import type {
  AdminSponsorPackageRow,
} from '@/lib/admin/songs';
import {
  CheckField,
} from '@/components/primitives/Field';
import { admin } from '@/lib/copy/admin';

type Props = {
  campaignId: string;
  sponsorPackage?:
    AdminSponsorPackageRow;
};

const fieldClass = [
  'min-h-11 w-full',
  'rounded-[var(--radius-panel)]',
  'border border-[var(--line)]',
  'bg-[var(--field-bg)] px-3 py-2',
  'font-mono text-sm',
  'text-[var(--text)]',
  'focus:border-[var(--champagne)]',
  'focus:outline-none',
].join(' ');

function priceValue(
  priceCents:
    | number
    | undefined,
): string {
  if (
    priceCents === undefined
  ) {
    return '';
  }

  return (
    priceCents / 100
  ).toFixed(2);
}

function Label({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
      {children}
    </span>
  );
}

export function SponsorPackageForm({
  campaignId,
  sponsorPackage,
}: Props) {
  const action =
    sponsorPackage
      ? updateSponsorPackage
      : createSponsorPackage;

  const [
    state,
    formAction,
  ] = useActionState<
    SponsorPackageAdminState,
    FormData
  >(
    action,
    {},
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6"
    >
      <input
        type="hidden"
        name="campaignId"
        value={campaignId}
      />

      {sponsorPackage ? (
        <input
          type="hidden"
          name="packageId"
          value={
            sponsorPackage.id
          }
        />
      ) : null}

      <div className="grid gap-5 md:grid-cols-3">
        <label className="flex flex-col gap-2">
          <Label>
            {
              admin.songs
                .sponsorPackageName
            }
          </Label>

          <input
            name="name"
            required
            maxLength={120}
            defaultValue={
              sponsorPackage?.name ??
              ''
            }
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <Label>
            {
              admin.songs
                .sponsorPackagePrice
            }
          </Label>

          <input
            name="price"
            required
            type="text"
            inputMode="decimal"
            placeholder="500.00"
            defaultValue={priceValue(
              sponsorPackage
                ?.priceCents,
            )}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <Label>
            {
              admin.songs
                .sponsorPackageSort
            }
          </Label>

          <input
            name="sortIndex"
            type="number"
            min={0}
            step={1}
            defaultValue={
              sponsorPackage
                ?.sortIndex ?? 0
            }
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <Label>
          {
            admin.songs
              .sponsorDeliverables
          }
        </Label>

        <textarea
          name="deliverables"
          rows={7}
          maxLength={5000}
          defaultValue={
            sponsorPackage
              ?.deliverables
              .join('\n') ?? ''
          }
          className={fieldClass}
        />

        <span className="font-mono text-[0.625rem] text-[var(--text-faint)]">
          {
            admin.songs
              .sponsorDeliverablesHint
          }
        </span>
      </label>

      <div className="flex flex-wrap gap-6">
        <CheckField
          name="includesBrandedVisual"
          label={
            admin.songs
              .includesBrandedVisual
          }
          defaultChecked={
            sponsorPackage
              ?.includesBrandedVisual ??
            false
          }
        />

        <CheckField
          name="isActive"
          label={
            admin.songs
              .sponsorPackageActive
          }
          defaultChecked={
            sponsorPackage
              ?.isActive ?? true
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="submit"
          className="rounded-full bg-[var(--champagne)] px-6 py-3 font-ui text-xs font-medium uppercase tracking-[0.05em] text-[var(--ink)] transition-[filter] [transition-duration:var(--duration-signature)] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {sponsorPackage
            ? admin.songs
                .saveSponsorPackage
            : admin.songs
                .createSponsorPackage}
        </button>

        {state.ok ? (
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {admin.saved}
          </span>
        ) : null}

        {state.error ? (
          <span
            className="font-mono text-eyebrow uppercase"
            style={{
              color: 'var(--ember)',
            }}
          >
            {admin.failed}
          </span>
        ) : null}
      </div>
    </form>
  );
}
