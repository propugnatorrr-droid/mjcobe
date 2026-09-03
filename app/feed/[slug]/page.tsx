import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileCta } from '@/components/MobileCta';
import { getPublicFeedPost } from '@/lib/feed/queries';
import { flagEnabled } from '@/lib/config/settings';
import { text } from '@/lib/copy/site-copy';

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (!(await flagEnabled('brandFeedEnabled'))) {
    return { title: await text('notfound.title') };
  }

  const post = await getPublicFeedPost(slug);
  if (!post) {
    return { title: await text('notfound.title') };
  }

  return {
    title: post.title ?? post.sponsorName,
    description: post.body ?? undefined,
  };
}

export default async function FeedPostPage({ params }: Props) {
  if (!(await flagEnabled('brandFeedEnabled'))) {
    notFound();
  }

  const { slug } = await params;
  const post = await getPublicFeedPost(slug);

  if (!post) {
    notFound();
  }

  const [sponsoredBy, backToFeed, relatedSongLabel] = await Promise.all([
    text('feed.sponsored_by'),
    text('feed.back_to_feed'),
    post.relatedSongTitle ? text('feed.related_song', { song: post.relatedSongTitle }) : Promise.resolve(null),
  ]);

  return (
    <main id="main-content" className="surface-ink min-h-screen">
      <SiteNav sub={post.sponsorName} />

      <article className="reading-shell section-space-compact">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--champagne)]"
        >
          <ArrowLeft aria-hidden size={14} />
          {backToFeed}
        </Link>

        <div className="mt-8 flex items-center gap-3 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-[var(--champagne)]">
          {post.sponsorLogoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.sponsorLogoPath}
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 rounded-full object-contain"
            />
          ) : null}
          <span>{sponsoredBy}</span>
          <Link href={`/partner/${post.sponsorSlug}`} className="text-[var(--text-dim)] hover:text-[var(--champagne)]">
            {post.sponsorName}
          </Link>
        </div>

        {post.title ? (
          <h1 className="mt-4 font-serif text-[clamp(2rem,5vw,3.25rem)] leading-tight text-[var(--text)]">
            {post.title}
          </h1>
        ) : null}

        {post.mediaPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.mediaPath}
            alt=""
            width={1200}
            height={800}
            className="mt-8 w-full rounded-[var(--radius-panel)] object-cover"
            style={{ backgroundColor: 'var(--ink-2)' }}
          />
        ) : null}

        {post.body ? (
          <p className="mt-8 whitespace-pre-line text-body text-[var(--text-dim)]">{post.body}</p>
        ) : null}

        {post.relatedSongSlug && relatedSongLabel ? (
          <Link
            href={`/song/${post.relatedSongSlug}`}
            className="mt-8 inline-flex items-center gap-2 font-ui text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--champagne)]"
          >
            {relatedSongLabel}
            <ArrowUpRight aria-hidden size={14} />
          </Link>
        ) : null}

        {post.ctaUrl && post.ctaLabel ? (
          <a
            href={post.ctaUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="mj-button mj-button--primary mt-10 inline-flex w-fit"
          >
            {post.ctaLabel}
            <ArrowUpRight aria-hidden size={16} strokeWidth={1.8} />
          </a>
        ) : null}
      </article>

      <SiteFooter />
      <MobileCta />
    </main>
  );
}
