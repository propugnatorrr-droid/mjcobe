import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  settlementModerationForName,
} from '@/lib/moderation/settlement';

describe(
  'settlement moderation',
  () => {
    it(
      'approves ordinary display names',
      () => {
        expect(
          settlementModerationForName(
            'Jordan M.',
          ),
        ).toBe('approved');
      },
    );

    it(
      'allows an empty anonymous identity',
      () => {
        expect(
          settlementModerationForName(
            null,
          ),
        ).toBe('approved');
      },
    );

    it(
      'flags URLs and spam markers',
      () => {
        expect(
          settlementModerationForName(
            'Visit https://spam.example',
          ),
        ).toBe('flagged');

        expect(
          settlementModerationForName(
            'Crypto giveaway',
          ),
        ).toBe('flagged');
      },
    );
  },
);
