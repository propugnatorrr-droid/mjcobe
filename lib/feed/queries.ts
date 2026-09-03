import 'server-only';
import { cache } from 'react';
import { and, desc, eq, getTableColumns, gt, isNull, lte, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';

export type FeedCursor = { sortPriority: number; publishedAt: Date; id: string };

const sponsorLogoAsset = alias(s.mediaAssets, 'sponsor_logo_asset');

export type PublicFeedPost = {
  id: string;
  slug: string;
  postType: string;
  title: string | null;
  body: string | null;
  mediaPath: string | null;
  mediaPlaceholder: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  relatedSongSlug: string | null;
  relatedSongTitle: string | null;
  publishedAt: Date;
  sponsorSlug: string;
  sponsorName: string;
  sponsorLogoPath: string | null;
};

/**
 * Public visibility requires BOTH the post's own moderation AND the
 * sponsor's moderation to be 'approved' — a post from a brand later
 * blocked disappears automatically, mirroring
 * lib/sponsor/queries.ts:getSponsorProfile()'s double-gate. Also requires
 * publishedAt to have passed and expiresAt (if set) not to have passed —
 * a scheduled-but-not-yet-live or expired post is never publicly reachable,
 * including by direct slug guess (getPublicFeedPost below applies the same
 * filter, not a looser one).
 *
 * This is the SQL form of lib/feed/visibility.ts's isPubliclyVisible() —
 * keep both in sync if this rule ever changes; the pure function is what
 * tests/feed-visibility.test.ts actually exercises, since it can't run
 * this SQL without a database.
 */
function publiclyVisibleWhere() {
  return and(
    eq(s.brandFeedPosts.moderation, 'approved'),
    eq(s.sponsors.moderation, 'approved'),
    lte(s.brandFeedPosts.publishedAt, new Date()),
    or(isNull(s.brandFeedPosts.expiresAt), gt(s.brandFeedPosts.expiresAt, new Date())),
  );
}

function selectPublicColumns() {
  return {
    id: s.brandFeedPosts.id,
    slug: s.brandFeedPosts.slug,
    postType: s.brandFeedPosts.postType,
    title: s.brandFeedPosts.title,
    body: s.brandFeedPosts.body,
    mediaPath: s.mediaAssets.path,
    mediaPlaceholder: s.mediaAssets.placeholder,
    ctaLabel: s.brandFeedPosts.ctaLabel,
    ctaUrl: s.brandFeedPosts.ctaUrl,
    relatedSongSlug: s.songs.slug,
    relatedSongTitle: s.songs.title,
    publishedAt: s.brandFeedPosts.publishedAt,
    sponsorSlug: s.sponsors.slug,
    sponsorName: s.sponsors.businessName,
    sponsorLogoPath: sponsorLogoAsset.path,
  };
}

/** Cursor-paginated by (sortPriority desc, publishedAt desc, id desc) so a
 * page boundary is stable even as new posts are approved between requests
 * — a plain OFFSET would skip/repeat rows as the approved set changes. */
export async function listPublicFeedPosts(input?: {
  limit?: number;
  cursor?: FeedCursor;
}): Promise<{ rows: PublicFeedPost[]; nextCursor: FeedCursor | null }> {
  const limit = Math.min(Math.max(input?.limit ?? 12, 1), 50);
  const cursor = input?.cursor;

  const cursorWhere = cursor
    ? sql`(${s.brandFeedPosts.sortPriority}, ${s.brandFeedPosts.publishedAt}, ${s.brandFeedPosts.id}) < (${cursor.sortPriority}, ${cursor.publishedAt.toISOString()}, ${cursor.id})`
    : undefined;

  const rows = await db
    .select({ ...selectPublicColumns(), sortPriority: s.brandFeedPosts.sortPriority })
    .from(s.brandFeedPosts)
    .innerJoin(s.sponsors, eq(s.sponsors.id, s.brandFeedPosts.sponsorId))
    .leftJoin(sponsorLogoAsset, eq(sponsorLogoAsset.id, s.sponsors.logoAssetId))
    .leftJoin(s.mediaAssets, eq(s.mediaAssets.id, s.brandFeedPosts.mediaAssetId))
    .leftJoin(s.songs, eq(s.songs.id, s.brandFeedPosts.relatedSongId))
    .where(cursorWhere ? and(publiclyVisibleWhere(), cursorWhere) : publiclyVisibleWhere())
    .orderBy(desc(s.brandFeedPosts.sortPriority), desc(s.brandFeedPosts.publishedAt), desc(s.brandFeedPosts.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];

  return {
    // publishedAt is nullable in the schema (a pending/scheduled post has
    // none) but publiclyVisibleWhere()'s `lte(publishedAt, now())` cannot
    // match a null row at the SQL level, so every row reaching here is
    // guaranteed to have one — assertNonNullPublishedAt makes that
    // guarantee explicit instead of silently trusting Drizzle's schema
    // nullability, which doesn't (and can't) know about the WHERE clause.
    rows: page.map(assertNonNullPublishedAt),
    nextCursor: hasMore && last
      ? { sortPriority: last.sortPriority, publishedAt: assertNonNullPublishedAt(last).publishedAt, id: last.id }
      : null,
  };
}

function assertNonNullPublishedAt<T extends { publishedAt: Date | null }>(
  row: T,
): T & { publishedAt: Date } {
  if (!row.publishedAt) {
    throw new Error('Feed query returned a row with no publishedAt despite the visibility filter.');
  }
  return row as T & { publishedAt: Date };
}

/** The N most recent approved posts — for the homepage preview row. */
export const getLatestPublicFeedPosts = cache(async (limit: number): Promise<PublicFeedPost[]> => {
  const { rows } = await listPublicFeedPosts({ limit });
  return rows;
});

export const getPublicFeedPost = cache(async (slug: string): Promise<PublicFeedPost | null> => {
  const [row] = await db
    .select(selectPublicColumns())
    .from(s.brandFeedPosts)
    .innerJoin(s.sponsors, eq(s.sponsors.id, s.brandFeedPosts.sponsorId))
    .leftJoin(sponsorLogoAsset, eq(sponsorLogoAsset.id, s.sponsors.logoAssetId))
    .leftJoin(s.mediaAssets, eq(s.mediaAssets.id, s.brandFeedPosts.mediaAssetId))
    .leftJoin(s.songs, eq(s.songs.id, s.brandFeedPosts.relatedSongId))
    .where(and(eq(s.brandFeedPosts.slug, slug), publiclyVisibleWhere()))
    .limit(1);

  return row ? assertNonNullPublishedAt(row) : null;
});

export type AdminFeedPost = typeof s.brandFeedPosts.$inferSelect & {
  sponsorSlug: string;
  sponsorName: string;
  sponsorModeration: string;
  sponsorLogoPath: string | null;
  /** The post's own submitted/attached media — distinct from the
   * sponsor's logo above, which is only for the review panel's context. */
  postMediaPath: string | null;
};

function adminFeedPostSelection() {
  return {
    ...getTableColumns(s.brandFeedPosts),
    sponsorSlug: s.sponsors.slug,
    sponsorName: s.sponsors.businessName,
    sponsorModeration: s.sponsors.moderation,
    sponsorLogoPath: sponsorLogoAsset.path,
    postMediaPath: s.mediaAssets.path,
  };
}

export async function listAdminFeedPosts(filter?: { moderation?: string }): Promise<AdminFeedPost[]> {
  return db
    .select(adminFeedPostSelection())
    .from(s.brandFeedPosts)
    .innerJoin(s.sponsors, eq(s.sponsors.id, s.brandFeedPosts.sponsorId))
    .leftJoin(sponsorLogoAsset, eq(sponsorLogoAsset.id, s.sponsors.logoAssetId))
    .leftJoin(s.mediaAssets, eq(s.mediaAssets.id, s.brandFeedPosts.mediaAssetId))
    .where(filter?.moderation ? eq(s.brandFeedPosts.moderation, filter.moderation as never) : undefined)
    .orderBy(desc(s.brandFeedPosts.submittedAt));
}

export async function getAdminFeedPost(id: string): Promise<AdminFeedPost | null> {
  const [row] = await db
    .select(adminFeedPostSelection())
    .from(s.brandFeedPosts)
    .innerJoin(s.sponsors, eq(s.sponsors.id, s.brandFeedPosts.sponsorId))
    .leftJoin(sponsorLogoAsset, eq(sponsorLogoAsset.id, s.sponsors.logoAssetId))
    .leftJoin(s.mediaAssets, eq(s.mediaAssets.id, s.brandFeedPosts.mediaAssetId))
    .where(eq(s.brandFeedPosts.id, id))
    .limit(1);

  return row ?? null;
}

export async function listApprovedSponsorsForSelect(): Promise<{ id: string; businessName: string }[]> {
  return db
    .select({ id: s.sponsors.id, businessName: s.sponsors.businessName })
    .from(s.sponsors)
    .where(eq(s.sponsors.moderation, 'approved'))
    .orderBy(s.sponsors.businessName);
}
