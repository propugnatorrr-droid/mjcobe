/**
 * Pure auto-approval rules for business sponsorship.
 *
 * A settled payment is the approval. There is no manual gate between money
 * arriving and a sponsor appearing publicly. Admin remains able to hide,
 * refund, or block after the fact — that is an exception path, not a queue
 * every payment must pass through.
 */

import {
  settlementModerationForName,
} from '@/lib/moderation/settlement';

export type SponsorAutoDecision = {
  /** What the sponsor record becomes. */
  sponsorModeration:
    | 'approved'
    | 'flagged';
  /** What the contribution record becomes. */
  contributionModeration:
    | 'approved'
    | 'flagged';
  /** Whether the row may appear on public leaderboards. */
  leaderboardVisible: boolean;
  /** True when a human should look, without blocking the payment. */
  needsAttention: boolean;
};

/**
 * A flagged name is withheld from public surfaces but the money is still
 * settled and still counts in the ledger. Nothing is refunded automatically;
 * the sponsor simply is not displayed until someone renames or clears it.
 */
export function sponsorAutoDecision(
  input: {
    businessName: string | null;
    /** Already-blocked identities stay blocked. */
    currentSponsorModeration?:
      | string
      | null;
  },
): SponsorAutoDecision {
  if (
    input.currentSponsorModeration ===
      'blocked' ||
    input.currentSponsorModeration ===
      'hidden'
  ) {
    return {
      sponsorModeration: 'flagged',
      contributionModeration:
        'flagged',
      leaderboardVisible: false,
      needsAttention: true,
    };
  }

  const nameCheck =
    settlementModerationForName(
      input.businessName,
    );

  if (nameCheck === 'flagged') {
    return {
      sponsorModeration: 'flagged',
      contributionModeration:
        'flagged',
      leaderboardVisible: false,
      needsAttention: true,
    };
  }

  return {
    sponsorModeration: 'approved',
    contributionModeration:
      'approved',
    leaderboardVisible: true,
    needsAttention: false,
  };
}
