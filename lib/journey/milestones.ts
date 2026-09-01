/**
 * Pure milestone rules. A milestone is a public claim about the campaign, so
 * it must be decidable from numbers alone and must never fire twice.
 *
 * Kinds here must match the milestone_kind enum exactly.
 */

export type MilestoneKind =
  | 'supporters_100'
  | 'raised_5k'
  | 'raised_10k'
  | 'funded_50'
  | 'funded_100';

export type MilestoneState = {
  supporterCount: number;
  raisedCents: number;
  goalCents: number;
};

/** Declared order is the publish order. */
const RULES: {
  kind: MilestoneKind;
  reached: (
    state: MilestoneState,
  ) => boolean;
}[] = [
  {
    kind: 'supporters_100',
    reached: (state) =>
      state.supporterCount >= 100,
  },
  {
    kind: 'raised_5k',
    reached: (state) =>
      state.raisedCents >= 500_000,
  },
  {
    kind: 'raised_10k',
    reached: (state) =>
      state.raisedCents >= 1_000_000,
  },
  {
    kind: 'funded_50',
    reached: (state) =>
      state.goalCents > 0 &&
      state.raisedCents * 2 >=
        state.goalCents,
  },
  {
    kind: 'funded_100',
    reached: (state) =>
      state.goalCents > 0 &&
      state.raisedCents >=
        state.goalCents,
  },
];

export function reachedMilestones(
  state: MilestoneState,
): MilestoneKind[] {
  return RULES.filter((rule) =>
    rule.reached(state),
  ).map((rule) => rule.kind);
}

/**
 * Milestones that are newly reached. A refund can drop the campaign back
 * below a threshold, but an already-published milestone is history and is
 * never retracted — it simply does not re-fire.
 */
export function newMilestones(
  state: MilestoneState,
  alreadyReached: readonly string[],
): MilestoneKind[] {
  const seen = new Set(alreadyReached);

  return reachedMilestones(state).filter(
    (kind) => !seen.has(kind),
  );
}

export const MILESTONE_JOURNEY_TITLES: Record<
  MilestoneKind,
  string
> = {
  supporters_100:
    '100 supporters backed this record',
  raised_5k: '$5,000 raised',
  raised_10k: '$10,000 raised',
  funded_50: 'Halfway to the goal',
  funded_100: 'Fully funded',
};

/** Which journey_event_kind carries each milestone. */
export const MILESTONE_EVENT_KIND: Record<
  MilestoneKind,
  | 'supporter_milestone'
  | 'funding_milestone'
> = {
  supporters_100: 'supporter_milestone',
  raised_5k: 'funding_milestone',
  raised_10k: 'funding_milestone',
  funded_50: 'funding_milestone',
  funded_100: 'funding_milestone',
};
