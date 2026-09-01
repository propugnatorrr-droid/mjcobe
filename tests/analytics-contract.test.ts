import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  analyticsKindNeedsCampaign,
  analyticsKindNeedsSong,
  parseAnalyticsPayload,
} from '@/lib/analytics/contracts';

const EVENT_ID =
  '11111111-1111-4111-8111-111111111111';

const SONG_ID =
  '22222222-2222-4222-8222-222222222222';

const CAMPAIGN_ID =
  '33333333-3333-4333-8333-333333333333';

describe(
  'analytics contract',
  () => {
    it(
      'accepts a valid event',
      () => {
        expect(
          parseAnalyticsPayload({
            eventId:
              EVENT_ID,
            kind:
              'song_page_view',
            songId:
              SONG_ID,
            campaignId:
              CAMPAIGN_ID,
            path:
              '/song/example',
            meta: {
              source:
                'song_page',
            },
          }),
        ).toMatchObject({
          eventId:
            EVENT_ID,
          kind:
            'song_page_view',
          songId:
            SONG_ID,
          campaignId:
            CAMPAIGN_ID,
        });
      },
    );

    it(
      'rejects unknown event kinds',
      () => {
        expect(
          parseAnalyticsPayload({
            eventId:
              EVENT_ID,
            kind:
              'email_address_stolen',
          }),
        ).toBeNull();
      },
    );

    it(
      'rejects invalid IDs',
      () => {
        expect(
          parseAnalyticsPayload({
            eventId:
              'not-a-uuid',
            kind:
              'song_page_view',
            songId:
              SONG_ID,
          }),
        ).toBeNull();
      },
    );

    it(
      'drops unapproved metadata',
      () => {
        const result =
          parseAnalyticsPayload({
            eventId:
              EVENT_ID,
            kind:
              'payment_failure',
            campaignId:
              CAMPAIGN_ID,
            meta: {
              reason:
                'declined',
              email:
                'private@example.com',
              cardNumber:
                '4242424242424242',
            },
          });

        expect(
          result?.meta,
        ).toEqual({
          reason:
            'declined',
        });
      },
    );

    it(
      'rejects external paths',
      () => {
        expect(
          parseAnalyticsPayload({
            eventId:
              EVENT_ID,
            kind:
              'song_page_view',
            songId:
              SONG_ID,
            path:
              'https://example.com',
          }),
        ).toBeNull();
      },
    );

    it(
      'defines required event contexts',
      () => {
        expect(
          analyticsKindNeedsSong(
            'audio_play',
          ),
        ).toBe(true);

        expect(
          analyticsKindNeedsCampaign(
            'checkout_start',
          ),
        ).toBe(true);

        expect(
          analyticsKindNeedsCampaign(
            'audio_play',
          ),
        ).toBe(false);
      },
    );
  },
);
