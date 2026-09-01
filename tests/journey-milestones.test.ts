import { describe, expect, it } from 'vitest';
import {
  MILESTONE_EVENT_KIND,
  MILESTONE_JOURNEY_TITLES,
  newMilestones,
  reachedMilestones,
} from '@/lib/journey/milestones';

const empty = {
  supporterCount: 0,
  raisedCents: 0,
  goalCents: 1_000_000,
};

describe('reachedMilestones', () => {
  it('reports nothing for an empty campaign', () => {
    expect(reachedMilestones(empty)).toEqual([]);
  });

  it('reports the supporter milestone at 100', () => {
    expect(
      reachedMilestones({
        ...empty,
        supporterCount: 100,
      }),
    ).toContain('supporters_100');
  });

  it('withholds the supporter milestone at 99', () => {
    expect(
      reachedMilestones({
        ...empty,
        supporterCount: 99,
      }),
    ).not.toContain('supporters_100');
  });

  it('reports the 5k milestone exactly at 5k', () => {
    expect(
      reachedMilestones({
        ...empty,
        raisedCents: 500_000,
      }),
    ).toContain('raised_5k');
  });

  it('reports 5k and 10k together at 10k', () => {
    const kinds = reachedMilestones({
      ...empty,
      raisedCents: 1_000_000,
    });
    expect(kinds).toContain('raised_5k');
    expect(kinds).toContain('raised_10k');
  });

  it('reports halfway funding at exactly half', () => {
    expect(
      reachedMilestones({
        ...empty,
        raisedCents: 500_000,
        goalCents: 1_000_000,
      }),
    ).toContain('funded_50');
  });

  it('withholds funding milestones without a goal', () => {
    const kinds = reachedMilestones({
      supporterCount: 0,
      raisedCents: 900_000,
      goalCents: 0,
    });
    expect(kinds).not.toContain('funded_50');
    expect(kinds).not.toContain('funded_100');
  });

  it('reports full funding when the goal is met', () => {
    expect(
      reachedMilestones({
        ...empty,
        raisedCents: 1_000_000,
      }),
    ).toContain('funded_100');
  });

  it('is deterministic in publish order', () => {
    expect(
      reachedMilestones({
        supporterCount: 250,
        raisedCents: 1_000_000,
        goalCents: 800_000,
      }),
    ).toEqual([
      'supporters_100',
      'raised_5k',
      'raised_10k',
      'funded_50',
      'funded_100',
    ]);
  });
});

describe('newMilestones', () => {
  it('returns only the unpublished ones', () => {
    expect(
      newMilestones(
        {
          supporterCount: 100,
          raisedCents: 500_000,
          goalCents: 10_000_000,
        },
        ['supporters_100'],
      ),
    ).toEqual(['raised_5k']);
  });

  it('never re-fires a published milestone', () => {
    expect(
      newMilestones(
        {
          supporterCount: 500,
          raisedCents: 1_000_000,
          goalCents: 1_000_000,
        },
        [
          'supporters_100',
          'raised_5k',
          'raised_10k',
          'funded_50',
          'funded_100',
        ],
      ),
    ).toEqual([]);
  });

  it('does not retract a milestone after a refund', () => {
    /* Published at 5k, refunded back to 4k. */
    expect(
      newMilestones(
        {
          supporterCount: 0,
          raisedCents: 400_000,
          goalCents: 10_000_000,
        },
        ['raised_5k'],
      ),
    ).toEqual([]);
  });

  it('ignores unknown stored kinds', () => {
    expect(
      newMilestones(
        {
          supporterCount: 100,
          raisedCents: 0,
          goalCents: 10_000_000,
        },
        ['new_top_sponsor'],
      ),
    ).toEqual(['supporters_100']);
  });

  it('has a title for every kind it can emit', () => {
    for (const kind of reachedMilestones({
      supporterCount: 1_000,
      raisedCents: 10_000_000,
      goalCents: 1_000_000,
    })) {
      expect(
        MILESTONE_JOURNEY_TITLES[kind],
      ).toBeTruthy();
      expect(
        MILESTONE_EVENT_KIND[kind],
      ).toBeTruthy();
    }
  });
});
