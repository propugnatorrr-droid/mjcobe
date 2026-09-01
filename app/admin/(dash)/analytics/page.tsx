import {
  AdminHeading,
  AdminHint,
  Table,
  Td,
} from '@/components/admin/ui';
import {
  campaignFunnels,
} from '@/lib/admin/analytics';
import {
  admin,
} from '@/lib/copy/admin';

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

export default async function AnalyticsPage() {
  const rows =
    await campaignFunnels();

  return (
    <section className="admin-v5-page">
      <AdminHeading>
        {admin.analytics.heading}
      </AdminHeading>

      <AdminHint>
        {admin.analytics.hint}
      </AdminHint>

      {rows.length === 0 ? (
        <p className="text-body text-[var(--text-dim)]">
          {admin.analytics.empty}
        </p>
      ) : (
        <Table
          head={[
            admin.analytics.campaign,
            admin.analytics.views,
            admin.analytics.listeners,
            admin.analytics
              .completions,
            admin.analytics
              .supportClicks,
            admin.analytics
              .sponsorClicks,
            admin.analytics
              .checkoutStarts,
            admin.analytics.failures,
            admin.analytics
              .conversions,
            admin.analytics
              .conversionRate,
            admin.analytics.revenue,
          ]}
        >
          {rows.map(
            (row) => (
              <tr
                key={
                  row.campaignId
                }
              >
                <Td>
                  <strong className="block">
                    {row.songTitle}
                  </strong>

                  <span className="mt-1 block text-sm text-[var(--text-dim)]">
                    {
                      row.campaignName
                    }
                  </span>
                </Td>

                <Td mono>
                  {row.views}
                </Td>

                <Td mono>
                  {row.listeners}
                </Td>

                <Td mono>
                  {
                    row.audioCompletions
                  }
                </Td>

                <Td mono>
                  {
                    row.supportClicks
                  }
                </Td>

                <Td mono>
                  {
                    row.sponsorClicks
                  }
                </Td>

                <Td mono>
                  {
                    row.checkoutStarts
                  }
                </Td>

                <Td mono>
                  {
                    row.paymentFailures
                  }
                </Td>

                <Td mono>
                  {row.conversions}
                </Td>

                <Td mono>
                  {percentFormatter.format(
                    row.conversionRate,
                  )}
                </Td>

                <Td mono nowrap>
                  {moneyFormatter.format(
                    row.revenueCents /
                      100,
                  )}
                </Td>
              </tr>
            ),
          )}
        </Table>
      )}
    </section>
  );
}
