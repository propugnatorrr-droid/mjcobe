import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  sponsorApprovalAction,
  sponsorDeclineAction,
} from '@/lib/sponsor/review';

describe(
  'sponsor approval decisions',
  () => {
    it(
      'captures an authorized sponsorship',
      () => {
        expect(
          sponsorApprovalAction({
            transactionState:
              'authorized',
            contributionModeration:
              'pending',
          }),
        ).toBe('capture');
      },
    );

    it(
      'does not capture an initiated sponsorship',
      () => {
        expect(
          sponsorApprovalAction({
            transactionState:
              'initiated',
            contributionModeration:
              'pending',
          }),
        ).toBe('wait');
      },
    );

    it(
      'does not approve a blocked contribution',
      () => {
        expect(
          sponsorApprovalAction({
            transactionState:
              'authorized',
            contributionModeration:
              'blocked',
          }),
        ).toBe('wait');
      },
    );

    it(
      'treats an existing settlement as complete',
      () => {
        expect(
          sponsorApprovalAction({
            transactionState:
              'settled',
            contributionModeration:
              'approved',
          }),
        ).toBe('complete');
      },
    );
  },
);

describe(
  'sponsor decline decisions',
  () => {
    it.each([
      'initiated',
      'authorized',
      'failed',
    ])(
      'cancels a %s transaction',
      (state) => {
        expect(
          sponsorDeclineAction(
            state,
          ),
        ).toBe('cancel');
      },
    );

    it.each([
      'settled',
      'partially_refunded',
    ])(
      'refunds a %s transaction',
      (state) => {
        expect(
          sponsorDeclineAction(
            state,
          ),
        ).toBe('refund');
      },
    );

    it.each([
      'canceled',
      'refunded',
    ])(
      'accepts an already %s transaction as complete',
      (state) => {
        expect(
          sponsorDeclineAction(
            state,
          ),
        ).toBe('complete');
      },
    );

    it(
      'does not hide a captured transaction before reconciliation',
      () => {
        expect(
          sponsorDeclineAction(
            'captured',
          ),
        ).toBe('wait');
      },
    );
  },
);
