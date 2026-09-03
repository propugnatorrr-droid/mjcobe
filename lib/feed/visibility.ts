/**
 * Pure spec for the same rule lib/feed/queries.ts's publiclyVisibleWhere()
 * enforces in SQL. Kept here, tested directly, so the visibility rule has
 * one readable definition to review and a regression guard independent of
 * hitting a real database — matching this repo's existing convention of
 * testing decision logic as pure functions (reconcileAction,
 * sponsorAutoDecision) rather than only integration-testing the query.
 */
export function isPubliclyVisible(
  post: {
    moderation: string;
    publishedAt: Date | null;
    expiresAt: Date | null;
  },
  sponsor: { moderation: string },
  now: Date = new Date(),
): boolean {
  if (post.moderation !== 'approved') return false;
  if (sponsor.moderation !== 'approved') return false;
  if (!post.publishedAt || post.publishedAt.getTime() > now.getTime()) return false;
  if (post.expiresAt && post.expiresAt.getTime() <= now.getTime()) return false;
  return true;
}
