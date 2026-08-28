'use client';

import {
  useActionState,
} from 'react';
import {
  createContract,
  updateContract,
  type ContractAdminState,
} from '@/lib/admin/contract-actions';
import type {
  AdminContractRow,
  ContractCampaignOption,
} from '@/lib/admin/contracts';
import { admin } from '@/lib/copy/admin';

type Props = {
  sponsorId: string;
  campaigns:
    ContractCampaignOption[];
  contract?:
    AdminContractRow;
};

const fieldClass = [
  'min-h-11 w-full',
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

export function SponsorContractForm({
  sponsorId,
  campaigns,
  contract,
}: Props) {
  const action = contract
    ? updateContract
    : createContract;

  const [
    state,
    formAction,
  ] = useActionState<
    ContractAdminState,
    FormData
  >(
    action,
    {},
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5"
    >
      <input
        type="hidden"
        name="sponsorId"
        value={sponsorId}
      />

      {contract ? (
        <input
          type="hidden"
          name="contractId"
          value={contract.id}
        />
      ) : null}

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {
            admin.sponsors
              .contractCampaign
          }
        </span>

        <select
          name="campaignId"
          defaultValue={
            contract?.campaignId ??
            ''
          }
          className={fieldClass}
        >
          <option value="">
            {
              admin.sponsors
                .contractNoCampaign
            }
          </option>

          {campaigns.map(
            (campaign) => (
              <option
                key={campaign.id}
                value={campaign.id}
              >
                {campaign.songTitle}
                {' — '}
                {campaign.name}
              </option>
            ),
          )}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {
            admin.sponsors
              .contractDocument
          }
        </span>

        <input
          type="text"
          name="pdfPath"
          defaultValue={
            contract?.pdfPath ??
            ''
          }
          placeholder="https://secure-document-location.example/contract.pdf"
          className={fieldClass}
        />

        <span className="text-xs leading-5 text-[var(--text-faint)]">
          {
            admin.sponsors
              .contractDocumentHint
          }
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {
            admin.sponsors
              .contractSignedAt
          }
        </span>

        <input
          type="datetime-local"
          name="signedAt"
          defaultValue={dateTimeValue(
            contract?.signedAt,
          )}
          className={fieldClass}
        />

        <span className="text-xs leading-5 text-[var(--text-faint)]">
          {
            admin.sponsors
              .contractSignedHint
          }
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="rounded-full bg-[var(--champagne)] px-5 py-2.5 font-ui text-xs font-medium uppercase tracking-[0.04em] text-[var(--ink)] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {contract
            ? admin.sponsors
                .saveContract
            : admin.sponsors
                .createContract}
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
              ? admin.sponsors
                  .contractInvalid
              : admin.failed}
          </span>
        ) : null}
      </div>
    </form>
  );
}
