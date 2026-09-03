import { listApprovedSponsorsForSelect } from '@/lib/feed/queries';
import { FeedPostForm } from '@/components/admin/FeedPostForm';
import { AdminHeading, AdminHint } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

export default async function NewFeedPostPage() {
  const sponsors = await listApprovedSponsorsForSelect();

  return (
    <>
      <AdminHeading>{admin.feed.newPost}</AdminHeading>
      <AdminHint>{admin.feed.hint}</AdminHint>

      <FeedPostForm sponsors={sponsors} />
    </>
  );
}
