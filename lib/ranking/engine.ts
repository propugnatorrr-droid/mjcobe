/**
 * Pure ranking logic. No database, no framework — so it can be exhaustively
 * tested, and so a refund can never produce a leaderboard that disagrees with
 * the ledger.
 *
 * Rank unit is the supporter identity per campaign. Value is the SUM of their
 * settled contributions. Ties break on who REACHED that total first, which is
 * the timestamp of the contribution that brought them to it — not their first
 * contribution ever.
 */

export type Standing = {
  id: string;
  amountCents: number;
  /** When this identity reached its current total. */
  reachedAt: Date;
};

export type RankedStanding = Standing & { rank: number };

export function rankStandings(standings: readonly Standing[]): RankedStanding[] {
  return [...standings]
    .filter((s) => s.amountCents > 0)
    .sort((a, b) =>
      b.amountCents - a.amountCents ||
      a.reachedAt.getTime() - b.reachedAt.getTime() ||
      a.id.localeCompare(b.id))
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

export function rankOf(ranked: readonly RankedStanding[], id: string): number | null {
  return ranked.find((r) => r.id === id)?.rank ?? null;
}

/**
 * What it costs to take #1, expressed as a TOP-UP.
 *
 * An outbid supporter sitting at $1,250 against a new leader at $1,400 needs
 * $151, not $1,401. Charging the full amount again is both worse for them and
 * worse for conversion.
 */
export function costToTakeFirst(args: {
  leaderCents: number;
  challengerCents: number;
  incrementCents: number;
}): number {
  const { leaderCents, challengerCents, incrementCents } = args;
  const required = leaderCents + incrementCents;
  return Math.max(incrementCents, required - challengerCents);
}

/** The floor a bid must clear to become #1, given an existing balance. */
export function minimumBidToLead(args: {
  leaderCents: number;
  challengerCents: number;
  incrementCents: number;
  floorCents: number;
}): number {
  return Math.max(
    args.floorCents,
    costToTakeFirst({
      leaderCents: args.leaderCents,
      challengerCents: args.challengerCents,
      incrementCents: args.incrementCents,
    }),
  );
}

/**
 * eBay-style extension. A crown taken in the last minutes of a campaign, with
 * nobody able to answer, is a worse story than one won in public.
 */
export function extendedCloseTime(args: {
  closesAt: Date;
  challengeAt: Date;
  windowHours: number;
  extensionHours: number;
}): Date {
  const { closesAt, challengeAt, windowHours, extensionHours } = args;
  const windowOpens = closesAt.getTime() - windowHours * 3_600_000;
  if (challengeAt.getTime() < windowOpens) return closesAt;
  return new Date(challengeAt.getTime() + extensionHours * 3_600_000);
}

export type GuardrailVerdict =
  | { allowed: true; warn: boolean }
  | { allowed: false; reason: 'daily_ceiling'; ceilingCents: number; spentCents: number };

/**
 * Protects real people from the competitive loop, and protects the project
 * from the one press cycle that could end it.
 */
export function checkSpendGuardrails(args: {
  proposedCents: number;
  spentLast24hCents: number;
  spentLast7dCents: number;
  dailyCeilingCents: number;
  weeklyWarningCents: number;
}): GuardrailVerdict {
  const projectedDay = args.spentLast24hCents + args.proposedCents;
  if (projectedDay > args.dailyCeilingCents) {
    return { allowed: false, reason: 'daily_ceiling', ceilingCents: args.dailyCeilingCents, spentCents: args.spentLast24hCents };
  }
  return { allowed: true, warn: args.spentLast7dCents + args.proposedCents > args.weeklyWarningCents };
}

export function fundedPercent(raisedCents: number, goalCents: number): number {
  if (goalCents <= 0) return 0;
  // Floor, never round: 99.6% must not display as 100% funded.
  return Math.max(0, Math.floor((raisedCents / goalCents) * 100));
}
