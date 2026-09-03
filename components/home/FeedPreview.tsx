import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import { FeedPostCard } from '@/components/feed/FeedPostCard';
import type { PublicFeedPost } from '@/lib/feed/queries';

type FeedPreviewProps = {
  posts: PublicFeedPost[];
  heading: string;
  cta: string;
  sponsoredByLabel: string;
  viewPostLabel: string;
};

/** A static grid, not a carousel — matches the explicit instruction to
 * avoid carousel accessibility/overflow risk unless proven necessary,
 * and mirrors PartnerStrip.tsx's own "return null rather than fabricate
 * placeholder content" contract when there's nothing eligible to show. */
export function FeedPreview({ posts, heading, cta, sponsoredByLabel, viewPostLabel }: FeedPreviewProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="home-feed-heading" className="home-feed-preview">
      <div className="site-shell">
        <div className="home-partner-strip-heading">
          <div id="home-feed-heading">
            <SectionHeading>{heading}</SectionHeading>
          </div>

          <Link href="/feed" className="home-partner-strip-view-all">
            <span>{cta}</span>
            <ArrowUpRight aria-hidden size={15} strokeWidth={1.8} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <FeedPostCard key={post.id} post={post} sponsoredByLabel={sponsoredByLabel} viewPostLabel={viewPostLabel} />
          ))}
        </div>
      </div>
    </section>
  );
}
