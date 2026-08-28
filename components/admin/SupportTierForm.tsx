'use client';

import { useActionState } from 'react';
import {
  createSupportTier,
  updateSupportTier,
  type TierAdminState,
} from '@/lib/admin/tier-actions';
import type {
  AdminSupportTierRow,
} from '@/lib/admin/songs';
import { admin } from '@/lib/copy/admin';
import {
  CheckField,
} from '@/components/primitives/Field';

const BADGES = [
  'supporter',
  'day_one',
  'inner_circle',
  'gold',
  'founding',
  'executive',
] as const;

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

function dateValue(
  date: Date | null | undefined,
): string {
  return date
    ? date.toISOString().slice(0, 16)
    : '';
}

function amountValue(
  amountCents:
    | number
    | undefined,
): string {
  return amountCents === undefined
    ? ''
    : (amountCents / 100).toFixed(2);
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

export function SupportTierForm({
  campaignId,
  tier,
}: {
  campaignId: string;
  tier?: AdminSupportTierRow;
}) {
  const action = tier
    ? updateSupportTier
    : createSupportTier;

  const [state, formAction] =
    useActionState<
      TierAdminState,
      FormData
    >(action, {});

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-[var(--radius-panel)] border border-[var(--line)] p-5"
    >
      <input
        type="hidden"
        name="campaignId"
        value={campaignId}
      />

      {tier ? (
        <input
          type="hidden"
          name="tierId"
          value={tier.id}
        />
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <Label>
            {admin.songs.tierName}
          </Label>
          <input
            name="name"
            required
            maxLength={120}
            defaultValue={tier?.name ?? ''}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <Label>
            {admin.songs.tierPrice}
          </Label>
          <input
            name="amount"
            required
            inputMode="decimal"
            placeholder="25.00"
            defaultValue={amountValue(
              tier?.amountCents,
            )}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <Label>
            {admin.songs.tierBadge}
          </Label>
          <select
            name="badgeKey"
            defaultValue={
              tier?.badgeKey ?? ''
            }
            className={fieldClass}
          >
            <option value="">
              {admin.songs.noBadge}
            </option>

            {BADGES.map((badge) => (
              <option
                key={badge}
                value={badge}
              >
                {
                  admin.songs
                    .tierBadges[badge]
                }
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <Label>
            {admin.songs.quantityLimit}
          </Label>
          <input
            name="quantityLimit"
            type="number"
            min={1}
            step={1}
            defaultValue={
              tier?.quantityLimit ?? ''
            }
            placeholder={
              admin.songs.unlimited
            }
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <Label>
            {admin.songs.startsAt}
          </Label>
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={dateValue(
              tier?.startsAt,
            )}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <Label>
            {admin.songs.expiresAt}
          </Label>
          <input
            name="expiresAt"
            type="datetime-local"
            defaultValue={dateValue(
              tier?.expiresAt,
            )}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <Label>
            {admin.songs.sortIndex}
          </Label>
          <input
            name="sortIndex"
            type="number"
            min={0}
            step={1}
            defaultValue={
              tier?.sortIndex ?? 0
            }
            className={fieldClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <Label>
          {admin.songs.tierDescription}
        </Label>
        <textarea
          name="description"
          rows={3}
          maxLength={1000}
          defaultValue={
            tier?.description ?? ''
          }
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <Label>
          {admin.songs.tierBenefits}
        </Label>
        <textarea
          name="benefits"
          rows={5}
          maxLength={4000}
          defaultValue={
            tier?.benefits.join('\n') ??
            ''
          }
          placeholder={
            admin.songs.benefitsHint
          }
          className={fieldClass}
        />
      </label>

      <div className="flex flex-wrap items-center gap-5">
        <CheckField
          name="isActive"
          label={admin.songs.tierActive}
          defaultChecked={
            tier?.isActive ?? true
          }
        />

        <button
          type="submit"
          className="rounded-full bg-[var(--champagne)] px-5 py-2.5 font-ui text-xs font-medium uppercase tracking-[0.04em] text-[var(--ink)] transition-[filter] [transition-duration:var(--duration-signature)] hover:brightness-110"
        >
          {tier
            ? admin.songs.saveTier
            : admin.songs.createTier}
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
