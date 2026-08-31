import {
  describe,
  expect,
  it,
} from 'vitest';

function net(
  entries: number[],
): number {
  return entries.reduce(
    (sum, amount) =>
      sum + amount,
    0,
  );
}

describe(
  'ledger settlement invariants',
  () => {
    it(
      'does not count an initiated payment',
      () => {
        expect(net([])).toBe(0);
      },
    );

    it(
      'counts one positive settlement',
      () => {
        expect(
          net([10_000]),
        ).toBe(10_000);
      },
    );

    it(
      'applies a partial refund',
      () => {
        expect(
          net([
            10_000,
            -2_500,
          ]),
        ).toBe(7_500);
      },
    );

    it(
      'removes a full refund',
      () => {
        expect(
          net([
            10_000,
            -10_000,
          ]),
        ).toBe(0);
      },
    );

    it(
      'restores a won dispute through an adjustment',
      () => {
        expect(
          net([
            10_000,
            -10_000,
            10_000,
          ]),
        ).toBe(10_000);
      },
    );
  },
);
