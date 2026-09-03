/**
 * Pure decision function for whether a submission invite can be redeemed
 * right now — extracted from lib/feed/invites.ts's validateSubmissionToken
 * so the rule can be unit-tested without a database, matching this repo's
 * convention (see lib/feed/visibility.ts / tests/feed-visibility.test.ts).
 * Keep both in sync if this rule ever changes.
 */
export type InviteRecord = {
  expiresAt: Date;
  revokedAt: Date | null;
  usedAt: Date | null;
};

export function isInviteUsable(invite: InviteRecord, sponsorModeration: string, now: Date): boolean {
  if (invite.revokedAt) return false;
  if (invite.usedAt) return false;
  if (invite.expiresAt.getTime() <= now.getTime()) return false;
  if (sponsorModeration !== 'approved') return false;
  return true;
}
