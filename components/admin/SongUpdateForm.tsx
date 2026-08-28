'use client';

import {
  useActionState,
} from 'react';
import {
  createSongUpdate,
  updateSongUpdate,
  type SongUpdateAdminState,
} from '@/lib/admin/song-update-actions';
import type {
  AdminCampaignRow,
  AdminSongUpdateRow,
} from '@/lib/admin/songs';
import {
  CheckField,
} from '@/components/primitives/Field';
import { admin } from '@/lib/copy/admin';

type Props = {
  songId: string;
  campaigns: AdminCampaignRow[];
  update?: AdminSongUpdateRow;
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

function dateValue(
  date: Date | null | undefined,
): string {
  return date
    ? date
        .toISOString()
        .slice(0, 16)
    : '';
}

function amountValue(
  amountCents:
    | number
    | undefined,
): string {
  if (
    !amountCents ||
    amountCents <= 0
  ) {
    return '';
  }

  return (
    amountCents / 100
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

export function SongUpdateForm({
  songId,
  campaigns,
  update,
}: Props) {
  const action = update
    ? updateSongUpdate
    : createSongUpdate;

  const [
    state,
    formAction,
  ] = useActionState<
    SongUpdateAdminState,
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
        name="songId"
        value={songId}
      />

      {update ? (
        <input
          type="hidden"
          name="updateId"
          value={update.id}
        />
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <Label>
            {admin.songs.updateTitle}
          </Label>

          <input
            name="title"
            required
            maxLength={200}
            defaultValue={
              update?.title ?? ''
            }
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <Label>
            {admin.songs.updateCampaign}
          </Label>

          <select
            name="campaignId"
            defaultValue={
              update?.campaignId ?? ''
            }
            className={fieldClass}
          >
            <option value="">
              {
                admin.songs
                  .noUpdateCampaign
              }
            </option>

            {campaigns.map(
              (campaign) => (
                <option
                  key={campaign.id}
                  value={campaign.id}
                >
                  {campaign.name}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <Label>
            {
              admin.songs
                .updateMinimumTier
            }
          </Label>

          <input
            name="minTierAmount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={amountValue(
              update?.minTierCents,
            )}
            className={fieldClass}
          />

          <span className="font-mono text-[0.625rem] text-[var(--text-faint)]">
            {
              admin.songs
                .updateMinimumTierHint
            }
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <Label>
            {
              admin.songs
                .updatePublishedAt
            }
          </Label>

          <input
            name="publishedAt"
            type="datetime-local"
            defaultValue={dateValue(
              update?.publishedAt,
            )}
            className={fieldClass}
          />

          <span className="font-mono text-[0.625rem] text-[var(--text-faint)]">
            {
              admin.songs
                .updateTimeHint
            }
          </span>
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <Label>
          {admin.songs.updateBody}
        </Label>

        <textarea
          name="body"
          required
          rows={7}
          maxLength={8000}
          defaultValue={
            update?.body ?? ''
          }
          className={fieldClass}
        />
      </label>

      <div className="flex flex-wrap items-center gap-5">
        <CheckField
          name="isVisible"
          label={
            admin.songs.updateVisible
          }
          defaultChecked={
            update?.isVisible ?? true
          }
        />

        <button
          type="submit"
          className="rounded-full bg-[var(--champagne)] px-6 py-3 font-ui text-xs font-medium uppercase tracking-[0.05em] text-[var(--ink)] transition-[filter] [transition-duration:var(--duration-signature)] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {update
            ? admin.songs.saveUpdate
            : admin.songs.createUpdate}
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
