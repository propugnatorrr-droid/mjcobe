import {
  listReferralLinks,
} from '@/lib/admin/referrals';
import {
  listAllCampaigns,
} from '@/lib/admin/queries';
import {
  AdminHeading,
  AdminHint,
  Table,
  Td,
} from '@/components/admin/ui';
import {
  ReferralLinkForm,
} from '@/components/admin/ReferralLinkForm';
import {
  admin,
} from '@/lib/copy/admin';
import {
  formatDay,
} from '@/lib/song/queries';

export const dynamic =
  'force-dynamic';

const percentFormatter =
  new Intl.NumberFormat(
    'en-US',
    {
      style: 'percent',
      maximumFractionDigits: 1,
    },
  );

const moneyFormatter =
  new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
    },
  );

export default async function ReferralsPage() {
  const [
    links,
    campaigns,
  ] = await Promise.all([
    listReferralLinks(),
    listAllCampaigns(),
  ]);

  const campaignOptions =
    campaigns.map(
      (campaign) => ({
        value:
          campaign.campaignId,
        label:
          campaign.label,
      }),
    );

  return (
    <>
      <AdminHeading>
        {admin.referrals.heading}
      </AdminHeading>

      <AdminHint>
        {admin.referrals.hint}
      </AdminHint>

      <ReferralLinkForm
        campaigns={
          campaignOptions
        }
      />

      <div className="mt-8">
        {links.length === 0 ? (
          <p className="text-body text-[var(--text-dim)]">
            {
              admin.referrals
                .empty
            }
          </p>
        ) : (
          <Table
            head={[
              admin.referrals.url,
              admin.referrals
                .campaign,
              admin.referrals.label,
              admin.referrals.visits,
              admin.referrals
                .uniqueSessions,
              admin.referrals
                .conversions,
              admin.referrals
                .conversionRate,
              admin.referrals
                .revenue,
              admin.referrals
                .averageContribution,
              admin.table.date,
            ]}
          >
            {links.map(
              async (link) => (
                <tr key={link.id}>
                  <Td mono>
                    /r/{link.code}
                  </Td>

                  <Td dim>
                    {link.campaignLabel ??
                      '—'}
                  </Td>

                  <Td dim>
                    {link.label ??
                      '—'}
                  </Td>

                  <Td mono>
                    {link.visits}
                  </Td>

                  <Td mono>
                    {
                      link.uniqueSessions
                    }
                  </Td>

                  <Td mono>
                    {
                      link.conversions
                    }
                  </Td>

                  <Td mono>
                    {percentFormatter.format(
                      link.conversionRate,
                    )}
                  </Td>

                  <Td mono>
                    {moneyFormatter.format(
                      link.revenueCents /
                        100,
                    )}
                  </Td>

                  <Td mono>
                    {moneyFormatter.format(
                      link
                        .averageContributionCents /
                        100,
                    )}
                  </Td>

                  <Td mono dim>
                    {await formatDay(
                      link.createdAt,
                    )}
                  </Td>
                </tr>
              ),
            )}
          </Table>
        )}
      </div>
    </>
  );
}
