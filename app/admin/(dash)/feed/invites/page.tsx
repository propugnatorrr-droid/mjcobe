import { listAdminSubmissionInvites, listApprovedSponsorsForSelect } from '@/lib/feed/queries';
import { InviteIssueForm } from '@/components/admin/InviteIssueForm';
import { InviteRow } from '@/components/admin/InviteRow';
import { AdminHeading, AdminHint, Table } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

export default async function AdminFeedInvitesPage() {
  const [invites, sponsors] = await Promise.all([listAdminSubmissionInvites(), listApprovedSponsorsForSelect()]);

  return (
    <>
      <AdminHeading>{admin.feed.invites.heading}</AdminHeading>
      <AdminHint>{admin.feed.invites.hint}</AdminHint>

      <div className="mb-10">
        <InviteIssueForm sponsors={sponsors} />
      </div>

      {invites.length === 0 ? (
        <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.feed.invites.empty}</p>
      ) : (
        <Table
          head={[
            admin.feed.invites.sponsorLabel,
            admin.feed.invites.status,
            admin.feed.invites.created,
            admin.feed.invites.expiresIn,
            '',
          ]}
        >
          {invites.map((invite) => (
            <InviteRow key={invite.id} invite={invite} />
          ))}
        </Table>
      )}
    </>
  );
}
