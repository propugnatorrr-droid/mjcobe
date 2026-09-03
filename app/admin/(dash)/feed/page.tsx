import Link from 'next/link';
import { listAdminFeedPosts } from '@/lib/feed/queries';
import { AdminHeading, AdminHint, StateDot, Table, Td } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

export default async function AdminFeedPage() {
  const posts = await listAdminFeedPosts();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <AdminHeading>{admin.feed.heading}</AdminHeading>
          <AdminHint>{admin.feed.hint}</AdminHint>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/admin/feed/invites"
            className="font-mono text-eyebrow uppercase text-[var(--text-dim)] transition-opacity [transition-duration:var(--duration-signature)] hover:opacity-70"
          >
            {admin.feed.invites.heading}
          </Link>
          <Link
            href="/admin/feed/new"
            className="font-mono text-eyebrow uppercase text-[var(--champagne)] transition-opacity [transition-duration:var(--duration-signature)] hover:opacity-70"
          >
            + {admin.feed.newPost}
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{admin.feed.empty}</p>
      ) : (
        <Table head={[admin.feed.status, admin.feed.sponsor, admin.feed.title, admin.feed.source, admin.feed.submitted]}>
          {posts.map((post) => (
            <tr key={post.id}>
              <Td>
                <Link href={`/admin/feed/${post.id}`} className="hover:text-[var(--champagne)]">
                  <StateDot state={post.moderation} />
                </Link>
              </Td>
              <Td dim>{post.sponsorName}</Td>
              <Td>
                <Link href={`/admin/feed/${post.id}`} className="hover:text-[var(--champagne)]">
                  {post.title || '(untitled)'}
                </Link>
              </Td>
              <Td dim mono>{post.submissionSource}</Td>
              <Td dim mono nowrap>
                {post.submittedAt.toLocaleDateString()}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
