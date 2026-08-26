'use client';

import { useActionState } from 'react';
import { createCampaign, updateCampaign, type AdminState } from '@/lib/admin/actions';
import { admin } from '@/lib/copy/admin';
import { AdminInput, AdminSelect } from './ui';
import { CheckField } from '@/components/primitives/Field';
import { formatCents, cents } from '@/lib/money/cents';
import type { AdminCampaignRow } from '@/lib/admin/songs';

const STATUS_OPTIONS = Object.entries(admin.songs.campaignStatuses).map(([value, label]) => ({ value, label }));
const KIND_OPTIONS = Object.entries(admin.songs.campaignKinds).map(([value, label]) => ({ value, label }));

export function CampaignForm({
  songId,
  campaign,
}: {
  songId: string;
  campaign?: AdminCampaignRow;
}) {
  const action = campaign ? updateCampaign : createCampaign;
  const [state, formAction] = useActionState<AdminState, FormData>(action, {});

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6 rounded-[var(--radius-panel)] border p-6"
      style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
    >
      <input type="hidden" name="songId" value={songId} />
      {campaign ? <input type="hidden" name="id" value={campaign.id} /> : null}

      <div className="flex flex-wrap items-end gap-6">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {admin.songs.campaignName}
          </span>
          <AdminInput name="name" defaultValue={campaign?.name} wide />
        </label>

        {!campaign ? (
          <label className="flex flex-col gap-2">
            <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              {admin.songs.campaignKind}
            </span>
            <AdminSelect name="kind" options={KIND_OPTIONS} defaultValue="release" />
          </label>
        ) : null}

        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {admin.songs.campaignGoal}
          </span>
          <AdminInput
            name="goal"
            defaultValue={campaign ? formatCents(cents(campaign.goalCents)) : ''}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {admin.songs.campaignStatus}
          </span>
          <AdminSelect name="status" options={STATUS_OPTIONS} defaultValue={campaign?.status ?? 'draft'} />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {admin.songs.campaignObjective}
        </span>
        <AdminInput name="objective" defaultValue={campaign?.objective ?? ''} wide />
      </label>

      <div className="flex flex-wrap gap-8">
        <CheckField
          label={admin.songs.fanSupport}
          name="fanSupportEnabled"
          defaultChecked={campaign?.fanSupportEnabled ?? true}
        />
        <CheckField
          label={admin.songs.businessSponsorship}
          name="businessSponsorshipEnabled"
          defaultChecked={campaign?.businessSponsorshipEnabled ?? true}
        />
      </div>

      <div className="flex items-center gap-6">
        <button
          type="submit"
          className="rounded-full bg-[var(--champagne)] px-5 py-2.5 font-ui text-xs font-medium uppercase tracking-[0.04em] text-[var(--ink)] transition-colors [transition-duration:var(--duration-signature)] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {campaign ? admin.songs.saveCampaign : admin.songs.createCampaign}
        </button>
        {state.ok ? (
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.saved}</span>
        ) : null}
        {state.error ? (
          <span className="font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
            {admin.failed}
          </span>
        ) : null}
      </div>
    </form>
  );
}
