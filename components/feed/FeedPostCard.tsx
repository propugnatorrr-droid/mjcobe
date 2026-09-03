import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { PublicFeedPost } from '@/lib/feed/queries';

export function FeedPostCard({
  post,
  sponsoredByLabel,
  viewPostLabel,
}: {
  post: PublicFeedPost;
  sponsoredByLabel: string;
  viewPostLabel: string;
}) {
  const href = `/feed/${post.slug}`;

  return (
    <article className="panel panel-interactive flex flex-col overflow-hidden">
      <Link href={href} aria-label={post.title ?? post.sponsorName} className="block">
        {post.mediaPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.mediaPath}
            alt=""
            width={800}
            height={600}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
            style={{
              backgroundColor: 'var(--ink)',
              backgroundImage: post.mediaPlaceholder ? `url("${post.mediaPlaceholder}")` : undefined,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[var(--champagne)]">
          {post.sponsorLogoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.sponsorLogoPath}
              alt=""
              width={18}
              height={18}
              className="h-[18px] w-[18px] shrink-0 rounded-full object-contain"
            />
          ) : null}
          <span>{sponsoredByLabel}</span>
          <Link href={`/partner/${post.sponsorSlug}`} className="text-[var(--text-dim)] hover:text-[var(--champagne)]">
            {post.sponsorName}
          </Link>
        </div>

        {post.title ? (
          <h2 className="font-serif text-xl leading-tight text-[var(--text)]">
            <Link href={href}>{post.title}</Link>
          </h2>
        ) : null}

        {post.body ? (
          <p className="line-clamp-3 text-sm leading-6 text-[var(--text-dim)]">{post.body}</p>
        ) : null}

        <Link
          href={href}
          className="mt-auto inline-flex w-fit items-center gap-2 pt-2 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--champagne)]"
        >
          {viewPostLabel}
          <ArrowUpRight aria-hidden size={13} />
        </Link>
      </div>
    </article>
  );
}
