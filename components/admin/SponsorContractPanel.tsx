import {
  FileCheck2,
  FileClock,
  ExternalLink,
} from 'lucide-react';
import type {
  AdminContractRow,
  ContractCampaignOption,
} from '@/lib/admin/contracts';
import { admin } from '@/lib/copy/admin';
import {
  SponsorContractForm,
} from './SponsorContractForm';

type Props = {
  sponsorId: string;
  contracts:
    AdminContractRow[];
  campaigns:
    ContractCampaignOption[];
};

function formatDate(
  value: Date,
): string {
  return value.toLocaleString(
    'en-US',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    },
  );
}

export function SponsorContractPanel({
  sponsorId,
  contracts,
  campaigns,
}: Props) {
  return (
    <section className="mt-10 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--ink-2)] p-6">
      <h2 className="font-mono text-eyebrow uppercase tracking-[0.14em] text-[var(--text)]">
        {
          admin.sponsors
            .contracts
        }
      </h2>

      <p className="mt-3 max-w-[62ch] text-body text-[var(--text-dim)]">
        {
          admin.sponsors
            .contractsHint
        }
      </p>

      {contracts.length === 0 ? (
        <p className="mt-6 text-body text-[var(--text-dim)]">
          {
            admin.sponsors
              .contractsEmpty
          }
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {contracts.map(
            (contract) => (
              <details
                key={contract.id}
                className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--ink)]"
              >
                <summary className="cursor-pointer list-none p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {contract.signedAt ? (
                        <FileCheck2
                          aria-hidden
                          size={18}
                          color="var(--champagne)"
                        />
                      ) : (
                        <FileClock
                          aria-hidden
                          size={18}
                          color="var(--text-dim)"
                        />
                      )}

                      <div>
                        <p className="font-ui text-sm uppercase tracking-[0.06em] text-[var(--text)]">
                          {contract.campaignName ??
                            admin.sponsors
                              .contractNoCampaign}
                        </p>

                        {contract.songTitle ? (
                          <p className="mt-1 text-xs text-[var(--text-dim)]">
                            {
                              contract.songTitle
                            }
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <span
                      className="font-mono text-eyebrow uppercase"
                      style={{
                        color:
                          contract.signedAt
                            ? 'var(--champagne)'
                            : 'var(--text-dim)',
                      }}
                    >
                      {contract.signedAt
                        ? admin.sponsors
                            .contractSigned
                        : admin.sponsors
                            .contractUnsigned}
                    </span>
                  </div>
                </summary>

                <div className="border-t border-[var(--line)] p-5">
                  <dl className="mb-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="font-mono text-eyebrow uppercase text-[var(--text-faint)]">
                        {
                          admin.sponsors
                            .contractCreated
                        }
                      </dt>

                      <dd className="mt-1 text-sm text-[var(--text)]">
                        {formatDate(
                          contract.createdAt,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-mono text-eyebrow uppercase text-[var(--text-faint)]">
                        {
                          admin.sponsors
                            .contractSignedAt
                        }
                      </dt>

                      <dd className="mt-1 text-sm text-[var(--text)]">
                        {contract.signedAt
                          ? formatDate(
                              contract.signedAt,
                            )
                          : '—'}
                      </dd>
                    </div>
                  </dl>

                  {contract.pdfPath ? (
                    <a
                      href={
                        contract.pdfPath
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mb-6 inline-flex items-center gap-2 font-ui text-xs font-semibold uppercase tracking-[0.14em] text-[var(--champagne)]"
                    >
                      {
                        admin.sponsors
                          .openContract
                      }

                      <ExternalLink
                        aria-hidden
                        size={14}
                      />
                    </a>
                  ) : null}

                  <SponsorContractForm
                    sponsorId={
                      sponsorId
                    }
                    campaigns={
                      campaigns
                    }
                    contract={
                      contract
                    }
                  />
                </div>
              </details>
            ),
          )}
        </div>
      )}

      <details className="mt-6 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--ink)]">
        <summary className="cursor-pointer p-5 font-mono text-eyebrow uppercase text-[var(--champagne)]">
          + {
            admin.sponsors
              .newContract
          }
        </summary>

        <div className="border-t border-[var(--line)] p-5">
          <SponsorContractForm
            sponsorId={sponsorId}
            campaigns={campaigns}
          />
        </div>
      </details>
    </section>
  );
}
