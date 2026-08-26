import { listReferralLinks } from '@/lib/admin/referrals';
import { listAllCampaigns } from '@/lib/admin/queries';
import { AdminHeading, AdminHint, Table, Td } from '@/components/admin/ui';
import { ReferralLinkForm } from '@/components/admin/ReferralLinkForm';
import { admin } from '@/lib/copy/admin';
import { formatDay } from '@/lib/song/queries';

export const dynamic = 'force-dynamic';

export default async function ReferralsPage() {
  const [links, campaigns] = await Promise.all([listReferralLinks(), listAllCampaigns()]);

  const campaignOptions = campaigns.map((c) => ({ value: c.campaignId, label: c.label }));

  return (
    <>
      <AdminHeading>{admin.referrals.heading}</AdminHeading>
      <AdminHint>{admin.referrals.hint}</AdminHint>

      <ReferralLinkForm campaigns={campaignOptions} />

      <div className="mt-8">
        {links.length === 0 ? (
          <p className="text-body text-[var(--text-dim)]">{admin.referrals.empty}</p>
        ) : (
          <Table head={[admin.referrals.url, admin.referrals.campaign, admin.referrals.label, admin.referrals.visits, admin.table.date]}>
            {links.map(async (link) => (
              <tr key={link.id}>
                <Td mono>/r/{link.code}</Td>
                <Td dim>{link.campaignLabel ?? '—'}</Td>
                <Td dim>{link.label ?? '—'}</Td>
                <Td mono>{link.visits}</Td>
                <Td mono dim>{await formatDay(link.createdAt)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </>
  );
}
