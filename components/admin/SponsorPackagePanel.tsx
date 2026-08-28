import type {
  AdminCampaignRow,
  AdminSponsorPackageRow,
} from '@/lib/admin/songs';
import {
  setSponsorPackageActive,
} from '@/lib/admin/sponsor-package-actions';
import {
  cents,
  formatCents,
} from '@/lib/money/cents';
import { admin } from '@/lib/copy/admin';
import {
  SponsorPackageForm,
} from './SponsorPackageForm';

type Props = {
  campaign: AdminCampaignRow;
  packages:
    AdminSponsorPackageRow[];
};

export function SponsorPackagePanel({
  campaign,
  packages,
}: Props) {
  return (
    <section
      className="rounded-[var(--radius-panel)] border border-[var(--line)] p-6"
      style={{
        background:
          'var(--ink-2)',
      }}
    >
      <div>
        <h3 className="font-display text-2xl uppercase text-[var(--text)]">
          {campaign.name}
        </h3>

        <p className="mt-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {
            admin.songs
              .sponsorPackages
          }
        </p>
      </div>

      {packages.length === 0 ? (
        <p className="mt-6 text-body text-[var(--text-dim)]">
          {
            admin.songs
              .sponsorPackagesEmpty
          }
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {packages.map(
            (sponsorPackage) => (
              <details
                key={
                  sponsorPackage.id
                }
                className="rounded-[var(--radius-panel)] border border-[var(--line)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
                  <span className="min-w-0">
                    <span className="block font-ui text-sm font-semibold uppercase tracking-[0.06em] text-[var(--text)]">
                      {
                        sponsorPackage.name
                      }
                    </span>

                    <span className="mt-1 block font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                      {formatCents(
                        cents(
                          sponsorPackage
                            .priceCents,
                        ),
                      )}
                      {' · '}
                      {sponsorPackage
                        .isActive
                        ? admin.songs
                            .active
                        : admin.songs
                            .inactive}
                    </span>
                  </span>

                  <span className="font-mono text-eyebrow uppercase text-[var(--champagne)]">
                    {
                      admin.actions
                        .manage
                    }
                  </span>
                </summary>

                <div className="border-t border-[var(--line)] p-4">
                  <SponsorPackageForm
                    campaignId={
                      campaign.id
                    }
                    sponsorPackage={
                      sponsorPackage
                    }
                  />

                  <form
                    action={
                      setSponsorPackageActive
                    }
                    className="mt-5"
                  >
                    <input
                      type="hidden"
                      name="packageId"
                      value={
                        sponsorPackage.id
                      }
                    />

                    <input
                      type="hidden"
                      name="action"
                      value={
                        sponsorPackage
                          .isActive
                          ? 'deactivate'
                          : 'activate'
                      }
                    />

                    <button
                      type="submit"
                      className="rounded-full border border-[var(--line)] px-4 py-2 font-mono text-eyebrow uppercase text-[var(--text-dim)] hover:border-[var(--champagne)] hover:text-[var(--champagne)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
                    >
                      {sponsorPackage
                        .isActive
                        ? admin.songs
                            .deactivateSponsorPackage
                        : admin.songs
                            .activateSponsorPackage}
                    </button>
                  </form>
                </div>
              </details>
            ),
          )}
        </div>
      )}

      <details className="mt-6 rounded-[var(--radius-panel)] border border-[var(--line)]">
        <summary className="cursor-pointer p-4 font-mono text-eyebrow uppercase text-[var(--champagne)]">
          + {
            admin.songs
              .newSponsorPackage
          }
        </summary>

        <div className="border-t border-[var(--line)] p-4">
          <SponsorPackageForm
            campaignId={
              campaign.id
            }
          />
        </div>
      </details>
    </section>
  );
}
