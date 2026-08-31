import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  createReferralCookie,
  parseReferralCookie,
} from '@/lib/checkout/referrals';

describe(
  'referral attribution',
  () => {
    beforeEach(() => {
      process.env
        .REFERRAL_COOKIE_SECRET =
        'phase-7-test-secret-at-least-32-characters';
    });

    it(
      'round-trips signed campaign attribution',
      () => {
        const now =
          new Date(
            '2026-01-01T00:00:00Z',
          );

        const token =
          createReferralCookie({
            referralLinkId:
              '11111111-1111-4111-8111-111111111111',
            campaignId:
              '22222222-2222-4222-8222-222222222222',
            now,
          });

        expect(
          parseReferralCookie(
            token,
            new Date(
              '2026-01-02T00:00:00Z',
            ),
          ),
        ).toMatchObject({
          referralLinkId:
            '11111111-1111-4111-8111-111111111111',
          campaignId:
            '22222222-2222-4222-8222-222222222222',
        });
      },
    );

    it(
      'rejects a modified token',
      () => {
        const token =
          createReferralCookie({
            referralLinkId:
              '11111111-1111-4111-8111-111111111111',
            campaignId:
              '22222222-2222-4222-8222-222222222222',
          });

        expect(
          parseReferralCookie(
            `${token}modified`,
          ),
        ).toBeNull();
      },
    );

    it(
      'rejects an expired token',
      () => {
        const token =
          createReferralCookie({
            referralLinkId:
              '11111111-1111-4111-8111-111111111111',
            campaignId:
              '22222222-2222-4222-8222-222222222222',
            now:
              new Date(
                '2025-01-01T00:00:00Z',
              ),
          });

        expect(
          parseReferralCookie(
            token,
            new Date(
              '2026-12-01T00:00:00Z',
            ),
          ),
        ).toBeNull();
      },
    );
  },
);
