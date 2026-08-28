'use client';

import {
  useActionState,
} from 'react';
import {
  createCampaign,
  setCampaignLifecycle,
  updateCampaign,
  type CampaignAdminState,
} from '@/lib/admin/campaign-actions';
import { admin } from '@/lib/copy/admin';
import {
  AdminInput,
  AdminSelect,
} from './ui';
import {
  CheckField,
} from '@/components/primitives/Field';
import {
  cents,
  formatCents,
} from '@/lib/money/cents';
import type {
  AdminCampaignRow,
} from '@/lib/admin/songs';

const STATUS_OPTIONS =
  Object.entries(
    admin.songs.campaignStatuses,
  ).map(
    ([value, label]) => ({
      value,
      label,
    }),
  );

const KIND_OPTIONS =
  Object.entries(
    admin.songs.campaignKinds,
  ).map(
    ([value, label]) => ({
      value,
      label,
    }),
  );

const dateFieldClass = [
  'min-h-11',
  'rounded-[var(--radius-panel)]',
  'border border-[var(--line)]',
  'bg-[var(--field-bg)]',
  'px-3 py-2',
  'font-mono text-sm',
  'text-[var(--text)]',
  'focus:border-[var(--champagne)]',
  'focus:outline-none',
].join(' ');

function dateTimeValue(
  value: Date | null | undefined,
): string {
  if (!value) {
    return '';
  }

  return value
    .toISOString()
    .slice(0, 16);
}

function LifecycleButton({
  campaignId,
  action,
  label,
  primary = false,
}: {
  campaignId: string;
  action:
    | 'launch'
    | 'pause'
    | 'resume'
    | 'close';
  label: string;
  primary?: boolean;
}) {
  return (
    <form
      action={
        setCampaignLifecycle
      }
    >
      <input
        type="hidden"
        name="campaignId"
        value={campaignId}
      />

      <input
        type="hidden"
        name="action"
        value={action}
      />

      <button
        type="submit"
        className={
          primary
            ? 'rounded-full bg-[var(--champagne)] px-5 py-2.5 font-ui text-xs font-medium uppercase tracking-[0.04em] text-[var(--ink)] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]'
            : 'rounded-full border border-[var(--line)] px-5 py-2.5 font-ui text-xs font-medium uppercase tracking-[0.04em] text-[var(--text-dim)] hover:border-[var(--champagne)] hover:text-[var(--champagne)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]'
        }
      >
        {label}
      </button>
    </form>
  );
}

export function CampaignForm({
  songId,
  campaign,
}: {
  songId: string;
  campaign?: AdminCampaignRow;
}) {
  const action = campaign
    ? updateCampaign
    : createCampaign;

  const [
    state,
    formAction,
  ] = useActionState<
    CampaignAdminState,
    FormData
  >(
    action,
    {},
  );

  return (
    <div
      className="rounded-[var(--radius-panel)] border p-6"
      style={{
        borderColor:
          'var(--line)',
        background:
          'var(--ink-2)',
      }}
    >
      <form
        action={formAction}
        className="flex flex-col gap-6"
      >
        <input
          type="hidden"
          name="songId"
          value={songId}
        />

        {campaign ? (
          <input
            type="hidden"
            name="id"
            value={campaign.id}
          />
        ) : null}

        <div className="flex flex-wrap items-end gap-6">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              {
                admin.songs
                  .campaignName
              }
            </span>

            <AdminInput
              name="name"
              defaultValue={
                campaign?.name
              }
              wide
            />
          </label>

          {!campaign ? (
            <label className="flex flex-col gap-2">
              <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                {
                  admin.songs
                    .campaignKind
                }
              </span>

              <AdminSelect
                name="kind"
                options={
                  KIND_OPTIONS
                }
                defaultValue="release"
              />
            </label>
          ) : null}

          <label className="flex flex-col gap-2">
            <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              {
                admin.songs
                  .campaignGoal
              }
            </span>

            <AdminInput
              name="goal"
              defaultValue={
                campaign
                  ? formatCents(
                      cents(
                        campaign.goalCents,
                      ),
                    )
                  : ''
              }
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              {
                admin.songs
                  .campaignStatus
              }
            </span>

            <AdminSelect
              name="status"
              options={
                STATUS_OPTIONS
              }
              defaultValue={
                campaign?.status ??
                'draft'
              }
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {
              admin.songs
                .campaignObjective
            }
          </span>

          <AdminInput
            name="objective"
            defaultValue={
              campaign?.objective ??
              ''
            }
            wide
          />
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              {
                admin.songs
                  .campaignStartsAt
              }
            </span>

            <input
              type="datetime-local"
              name="startsAt"
              defaultValue={dateTimeValue(
                campaign?.startsAt,
              )}
              className={
                dateFieldClass
              }
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              {
                admin.songs
                  .campaignEndsAt
              }
            </span>

            <input
              type="datetime-local"
              name="endsAt"
              defaultValue={dateTimeValue(
                campaign?.endsAt,
              )}
              className={
                dateFieldClass
              }
            />
          </label>
        </div>

        <p className="font-mono text-[0.625rem] uppercase text-[var(--text-faint)]">
          {
            admin.songs
              .campaignTimeHint
          }
        </p>

        <div className="flex flex-wrap gap-8">
          <CheckField
            label={
              admin.songs
                .acceptSupport
            }
            name="acceptSupport"
            defaultChecked={
              campaign
                ?.acceptSupport ??
              true
            }
          />

          <CheckField
            label={
              admin.songs
                .fanSupport
            }
            name="fanSupportEnabled"
            defaultChecked={
              campaign
                ?.fanSupportEnabled ??
              true
            }
          />

          <CheckField
            label={
              admin.songs
                .businessSponsorship
            }
            name="businessSponsorshipEnabled"
            defaultChecked={
              campaign
                ?.businessSponsorshipEnabled ??
              true
            }
          />
        </div>

        <div className="flex items-center gap-6">
          <button
            type="submit"
            className="rounded-full bg-[var(--champagne)] px-5 py-2.5 font-ui text-xs font-medium uppercase tracking-[0.04em] text-[var(--ink)] transition-colors [transition-duration:var(--duration-signature)] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
          >
            {campaign
              ? admin.songs
                  .saveCampaign
              : admin.songs
                  .createCampaign}
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
                color:
                  'var(--ember)',
              }}
            >
              {state.error ===
              'invalid'
                ? admin.songs
                    .campaignInvalid
                : admin.failed}
            </span>
          ) : null}
        </div>
      </form>

      {campaign ? (
        <div className="mt-6 border-t border-[var(--line)] pt-6">
          <p className="mb-4 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {
              admin.songs
                .campaignControls
            }
          </p>

          <div className="flex flex-wrap gap-3">
            {campaign.status !==
            'live' ? (
              <LifecycleButton
                campaignId={
                  campaign.id
                }
                action="launch"
                label={
                  admin.songs
                    .launchCampaign
                }
                primary
              />
            ) : null}

            {campaign.status ===
              'live' &&
            campaign.acceptSupport ? (
              <LifecycleButton
                campaignId={
                  campaign.id
                }
                action="pause"
                label={
                  admin.songs
                    .pauseCampaign
                }
              />
            ) : null}

            {campaign.status ===
              'live' &&
            !campaign.acceptSupport ? (
              <LifecycleButton
                campaignId={
                  campaign.id
                }
                action="resume"
                label={
                  admin.songs
                    .resumeCampaign
                }
                primary
              />
            ) : null}

            {campaign.status !==
              'closed' &&
            campaign.status !==
              'archived' ? (
              <LifecycleButton
                campaignId={
                  campaign.id
                }
                action="close"
                label={
                  admin.songs
                    .closeCampaign
                }
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
