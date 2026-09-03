import { notFound } from 'next/navigation';
import { getAdminFeedPost, listApprovedSponsorsForSelect } from '@/lib/feed/queries';
import { FeedPostForm } from '@/components/admin/FeedPostForm';
import { FeedModerationPanel } from '@/components/admin/FeedModerationPanel';
import { AdminHeading, AdminHint, StateDot } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function AdminFeedPostPage({ params }: Props) {
  const { id } = await params;
  const [post, sponsors] = await Promise.all([getAdminFeedPost(id), listApprovedSponsorsForSelect()]);

  if (!post) {
    notFound();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <AdminHeading>{post.title || '(untitled)'}</AdminHeading>
        <StateDot state={post.moderation} />
      </div>
      <AdminHint>{admin.feed.review}</AdminHint>

      {post.sponsorModeration !== 'approved' ? (
        <div
          className="mb-8 max-w-2xl border p-4 font-mono text-eyebrow uppercase"
          style={{ borderColor: 'var(--ember)', color: 'var(--ember)' }}
        >
          {admin.feed.sponsorBlocked}
        </div>
      ) : null}

      <div className="mb-8 max-w-2xl border p-4" style={{ borderColor: 'var(--line)' }}>
        <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.feed.sponsorContext}</p>
        <p className="mt-2 font-serif text-lg text-[var(--text)]">{post.sponsorName}</p>
        <p className="mt-1 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {post.sponsorModeration} · {post.submissionSource}
        </p>
      </div>

      {post.originalSubmission ? (
        <details className="mb-8 max-w-2xl border p-4" style={{ borderColor: 'var(--line)' }}>
          <summary className="cursor-pointer font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {admin.feed.originalSubmission}
          </summary>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-[var(--text-dim)]">
            {JSON.stringify(post.originalSubmission, null, 2)}
          </pre>
        </details>
      ) : null}

      <FeedModerationPanel postId={post.id} currentModeration={post.moderation} />

      <div className="mt-10">
        <FeedPostForm
          postId={post.id}
          sponsors={sponsors}
          initial={{
            sponsorId: post.sponsorId,
            postType: post.postType,
            title: post.title,
            body: post.body,
            ctaLabel: post.ctaLabel,
            ctaUrl: post.ctaUrl,
            relatedSongId: post.relatedSongId,
            relatedCampaignId: post.relatedCampaignId,
            rightsAttested: post.rightsAttested,
            mediaPath: post.postMediaPath,
          }}
        />
      </div>
    </>
  );
}
