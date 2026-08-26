import { listAllCampaigns } from '@/lib/admin/queries';
import { OfflineForm } from '@/components/admin/OfflineForm';
import { AdminHeading, AdminHint } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

export default async function OfflinePage() {
  const campaigns = await listAllCampaigns();

  return (
    <>
      <AdminHeading>{admin.offline.heading}</AdminHeading>
      <AdminHint>{admin.offline.hint}</AdminHint>
      <OfflineForm
        campaigns={campaigns.map((c) => ({ value: c.campaignId, label: c.label }))}
      />
    </>
  );
}
