import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  compareRankedIdentity,
  minimumToLead,
  shouldSendOutbid,
} from '@/lib/ranking/order';

describe(
  'ranking integrity',
  () => {
    it(
      'orders by net amount descending',
      () => {
        const rows = [
          {
            identityId: 'b',
            amountCents: 1000,
            firstSupportedAt:
              new Date(100),
          },
          {
            identityId: 'a',
            amountCents: 2000,
            firstSupportedAt:
              new Date(200),
          },
        ].sort(
          compareRankedIdentity,
        );

        expect(
          rows[0].identityId,
        ).toBe('a');
      },
    );

    it(
      'uses earliest support as the tie breaker',
      () => {
        const rows = [
          {
            identityId: 'b',
            amountCents: 2000,
            firstSupportedAt:
              new Date(200),
          },
          {
            identityId: 'a',
            amountCents: 2000,
            firstSupportedAt:
              new Date(100),
          },
        ].sort(
          compareRankedIdentity,
        );

        expect(
          rows[0].identityId,
        ).toBe('a');
      },
    );

    it(
      'uses stable identity as the final tie breaker',
      () => {
        const time =
          new Date(100);

        const rows = [
          {
            identityId: 'b',
            amountCents: 2000,
            firstSupportedAt:
              time,
          },
          {
            identityId: 'a',
            amountCents: 2000,
            firstSupportedAt:
              time,
          },
        ].sort(
          compareRankedIdentity,
        );

        expect(
          rows.map(
            (row) =>
              row.identityId,
          ),
        ).toEqual([
          'a',
          'b',
        ]);
      },
    );

    it(
      'calculates only the additional amount required',
      () => {
        expect(
          minimumToLead(
            10_000,
            8_500,
            100,
          ),
        ).toBe(1_600);
      },
    );

    it(
      'does not notify when the same leader tops up',
      () => {
        expect(
          shouldSendOutbid({
            previousLeaderId:
              'leader-a',
            currentLeaderId:
              'leader-a',
            winnerIdentityId:
              'leader-a',
          }),
        ).toBe(false);
      },
    );

    it(
      'notifies only when another identity takes first place',
      () => {
        expect(
          shouldSendOutbid({
            previousLeaderId:
              'leader-a',
            currentLeaderId:
              'leader-b',
            winnerIdentityId:
              'leader-b',
          }),
        ).toBe(true);
      },
    );
  },
);
