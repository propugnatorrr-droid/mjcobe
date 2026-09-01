/**
 * Pure badge rules. No database, no framework — badges are public status, and
 * status must be reproducible from a settled contribution alone.
 *
 * Every key here must exist as a row in `badges` (unique on key) and should
 * have a mark in lib/supporter/badges.ts.
 */

export const FAN_BADGE_THRESHOLDS = {
  /** Supporter numbers at or below this are "day one". */
  dayOneNumber: 100,
  /** Single-contribution amount for the inner circle badge. */
  innerCircleCents: 10_000,
  /** Single-contribution amount for the gold badge. */
  goldCents: 50_000,
  /** Rank at or below this earns the top-ten badge. */
  topTenRank: 10,
} as const;

/**
 * Widened deliberately. FAN_BADGE_THRESHOLDS is `as const` so the shipped
 * values are literals, but a caller (and every test) must be free to pass
 * ordinary numbers.
 */
export type FanBadgeThresholds = {
  dayOneNumber: number;
  innerCircleCents: number;
  goldCents: number;
  topTenRank: number;
};

export type FanBadgeInput = {
  /** The amount of the contribution that just settled. */
  amountCents: number;
  /** Issued supporter number, or null when none was minted. */
  supporterNumber: number | null;
  /** Issued founding number, or null when the series was exhausted. */
  foundingNumber: number | null;
  /** Campaign rank after settlement, or null when unranked. */
  rank: number | null;
  thresholds?: FanBadgeThresholds;
};


/** Declared order is the grant order, so output is deterministic. */
const BADGE_ORDER = [
  'supporter',
  'day_one',
  'founding_100',
  'inner_circle',
  'gold',
  'top_ten',
  'number_one',
] as const;

export type FanBadgeKey = (typeof BADGE_ORDER)[number];

export function fanBadgeKeys(
  input: FanBadgeInput,
): FanBadgeKey[] {
  const limits =
    input.thresholds ??
    FAN_BADGE_THRESHOLDS;

  const earned = new Set<FanBadgeKey>();

  /*
   * A settled fan contribution is always worth
   * the base badge. Money moved; that is the
   * whole requirement.
   */
  if (input.amountCents > 0) {
    earned.add('supporter');
  } else {
    return [];
  }

  if (
    input.supporterNumber !== null &&
    input.supporterNumber > 0 &&
    input.supporterNumber <=
      limits.dayOneNumber
  ) {
    earned.add('day_one');
  }

  if (
    input.foundingNumber !== null &&
    input.foundingNumber > 0
  ) {
    earned.add('founding_100');
  }

  if (
    input.amountCents >=
    limits.innerCircleCents
  ) {
    earned.add('inner_circle');
  }

  if (
    input.amountCents >= limits.goldCents
  ) {
    earned.add('gold');
  }

  if (
    input.rank !== null &&
    input.rank > 0 &&
    input.rank <= limits.topTenRank
  ) {
    earned.add('top_ten');
  }

  if (input.rank === 1) {
    earned.add('number_one');
  }

  return BADGE_ORDER.filter((key) =>
    earned.has(key),
  );
}
