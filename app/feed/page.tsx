import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileCta } from '@/components/MobileCta';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { FeedPostCard } from '@/components/feed/FeedPostCard';
import { listPublicFeedPosts, type FeedCursor } from '@/lib/feed/queries';
import { flagEnabled } from '@/lib/config/settings';
import { text } from '@/lib/copy/site-copy';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  if (!(await flagEnabled('brandFeedEnabled'))) {
    return { title: await text('notfound.title') };
  }

  return {
    title: 'The Feed',
    description: 'Approved brand content from MJ COBE partners.',
  };
}

/** `sortPriority:publishedAtIso:id` — opaque to the client, just carried
 * back verbatim on the "load more" link. Malformed input degrades to "no
 * cursor" (first page) rather than a 500. */
function parseCursor(raw: string | undefined): FeedCursor | undefined {
  if (!raw) return undefined;
  const [sortPriorityRaw, publishedAtRaw, id] = raw.split(':');
  const sortPriority = Number(sortPriorityRaw);
  const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : null;
  if (!id || Number.isNaN(sortPriority) || !publishedAt || Number.isNaN(publishedAt.getTime())) {
    return undefined;
  }
  return { sortPriority, publishedAt, id };
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  if (!(await flagEnabled('brandFeedEnabled'))) {
    notFound();
  }

  const { cursor: cursorParam } = await searchParams;
  const cursor = parseCursor(cursorParam);

  const [{ rows, nextCursor }, title, eyebrow, intro, empty, loadMore, sponsoredBy, viewPost] =
    await Promise.all([
      listPublicFeedPosts({ limit: 12, cursor }),
      text('feed.title'),
      text('feed.eyebrow'),
      text('feed.intro'),
      text('feed.empty'),
      text('feed.load_more'),
      text('feed.sponsored_by'),
      text('feed.view_post'),
    ]);

  return (
    <main id="main-content" className="surface-ink min-h-screen">
      <SiteNav sub={title} />

      <header className="site-shell section-space-compact">
        <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-[var(--champagne)]">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5rem)] uppercase leading-none text-[var(--text)]">
          {title}
        </h1>
        <p className="mt-4 max-w-[52ch] text-body text-[var(--text-dim)]">{intro}</p>
      </header>

      <section aria-labelledby="feed-list-heading" className="site-shell section-space-compact pt-0">
        <div id="feed-list-heading" className="sr-only">
          <SectionHeading>{title}</SectionHeading>
        </div>

        {rows.length === 0 ? (
          <div className="panel p-8 sm:p-10">
            <p className="max-w-[52ch] text-base leading-7 text-[var(--text-dim)]">{empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((post) => (
              <FeedPostCard key={post.id} post={post} sponsoredByLabel={sponsoredBy} viewPostLabel={viewPost} />
            ))}
          </div>
        )}

        {nextCursor ? (
          <div className="mt-10 flex justify-center">
            <Link
              href={{
                pathname: '/feed',
                query: {
                  cursor: `${nextCursor.sortPriority}:${nextCursor.publishedAt.toISOString()}:${nextCursor.id}`,
                },
              }}
              className="inline-flex items-center gap-2 font-ui text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--champagne)]"
            >
              {loadMore}
              <ArrowUpRight aria-hidden size={14} />
            </Link>
          </div>
        ) : null}
      </section>

      <SiteFooter />
      <MobileCta />
    </main>
  );
}
