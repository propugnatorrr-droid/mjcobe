import {
  describe,
  expect,
  it,
} from 'vitest';

function visibleAmount(
  amountCents: number,
  hideAmount: boolean,
): number | null {
  return hideAmount
    ? null
    : amountCents;
}

describe(
  'leaderboard privacy',
  () => {
    it(
      'does not expose a hidden amount',
      () => {
        expect(
          visibleAmount(
            250_000,
            true,
          ),
        ).toBeNull();
      },
    );

    it(
      'keeps visible amounts available',
      () => {
        expect(
          visibleAmount(
            25_000,
            false,
          ),
        ).toBe(25_000);
      },
    );
  },
);
