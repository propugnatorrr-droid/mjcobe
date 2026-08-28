import type {
  AdminCampaignRow,
  AdminSupportTierRow,
} from '@/lib/admin/songs';
import {
  setSupportTierActive,
} from '@/lib/admin/tier-actions';
import { admin } from '@/lib/copy/admin';
import {
  cents,
  formatCents,
} from '@/lib/money/cents';
import {
  SupportTierForm,
} from './SupportTierForm';

export function SupportTierPanel({
  campaign,
  tiers,
}: {
  campaign: AdminCampaignRow;
  tiers: AdminSupportTierRow[];
}) {
  return (
    <section
      className="rounded-[var(--radius-panel)] border border-[var(--line)] p-6"
      style={{
        background: 'var(--ink-2)',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl uppercase text-[var(--text)]">
            {campaign.name}
          </h3>
          <p className="mt-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {admin.songs.supportTiers}
          </p>
        </div>
      </div>

      {tiers.length === 0 ? (
        <p className="mt-6 text-body text-[var(--text-dim)]">
          {admin.songs.tiersEmpty}
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {tiers.map((tier) => (
            <details
              key={tier.id}
              className="rounded-[var(--radius-panel)] border border-[var(--line)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
                <span>
                  <span className="block font-ui text-sm uppercase text-[var(--text)]">
                    {tier.name}
                  </span>
                  <span className="mt-1 block font-mono text-xs text-[var(--text-dim)]">
                    {formatCents(
                      cents(tier.amountCents),
                    )}
                    {' — '}
                    {tier.isActive
                      ? admin.songs.active
                      : admin.songs.inactive}
                  </span>
                </span>

                <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                  {admin.actions.edit}
                </span>
              </summary>

              <div className="border-t border-[var(--line)] p-4">
                <SupportTierForm
                  campaignId={campaign.id}
                  tier={tier}
                />

                <form
                  action={
                    setSupportTierActive
                  }
                  className="mt-4"
                >
                  <input
                    type="hidden"
                    name="tierId"
                    value={tier.id}
                  />
                  <input
                    type="hidden"
                    name="action"
                    value={
                      tier.isActive
                        ? 'deactivate'
                        : 'activate'
                    }
                  />

                  <button
                    type="submit"
                    className="rounded-full border border-[var(--line)] px-4 py-2 font-mono text-eyebrow uppercase text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--champagne)] hover:text-[var(--text)]"
                  >
                    {tier.isActive
                      ? admin.songs.deactivateTier
                      : admin.songs.activateTier}
                  </button>
                </form>
              </div>
            </details>
          ))}
        </div>
      )}

      <details className="mt-6 rounded-[var(--radius-panel)] border border-[var(--line)]">
        <summary className="cursor-pointer p-4 font-mono text-eyebrow uppercase text-[var(--champagne)]">
          + {admin.songs.newTier}
        </summary>

        <div className="border-t border-[var(--line)] p-4">
          <SupportTierForm
            campaignId={campaign.id}
          />
        </div>
      </details>
    </section>
  );
}
