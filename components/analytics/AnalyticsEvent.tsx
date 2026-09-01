'use client';

import {
  useEffect,
  useRef,
} from 'react';
import type {
  AnalyticsKind,
} from '@/lib/analytics/contracts';

export type TrackAnalyticsInput = {
  kind: AnalyticsKind;
  songId?: string;
  campaignId?: string;
  meta?: Record<
    string,
    string | number | boolean
  >;
};

export function trackAnalytics(
  input: TrackAnalyticsInput,
): void {
  if (
    typeof window ===
    'undefined'
  ) {
    return;
  }

  const eventId =
    crypto.randomUUID();

  const body =
    JSON.stringify({
      eventId,
      kind: input.kind,
      songId:
        input.songId,
      campaignId:
        input.campaignId,
      path:
        window.location.pathname,
      referrer:
        document.referrer ||
        undefined,
      meta:
        input.meta ?? {},
    });

  void fetch(
    '/api/analytics',
    {
      method: 'POST',
      headers: {
        'content-type':
          'application/json',
      },
      body,
      keepalive: true,
      credentials:
        'same-origin',
    },
  ).catch(() => {
    /*
     * Analytics must never block
     * playback, navigation or payment.
     */
  });
}

export function AnalyticsEvent({
  kind,
  songId,
  campaignId,
  meta,
  watchClicks = false,
}: TrackAnalyticsInput & {
  watchClicks?: boolean;
}) {
  const sent =
    useRef(false);

  useEffect(() => {
    if (sent.current) {
      return;
    }

    sent.current = true;

    trackAnalytics({
      kind,
      songId,
      campaignId,
      meta,
    });
  }, [
    kind,
    songId,
    campaignId,
    meta,
  ]);

  useEffect(() => {
    if (!watchClicks) {
      return;
    }

    function handleClick(
      event: MouseEvent,
    ) {
      const target =
        event.target;

      if (
        !(target instanceof Element)
      ) {
        return;
      }

      const tracked =
        target.closest<HTMLElement>(
          '[data-analytics-kind]',
        );

      if (!tracked) {
        return;
      }

      const trackedKind =
        tracked.dataset
          .analyticsKind as
          | AnalyticsKind
          | undefined;

      if (!trackedKind) {
        return;
      }

      trackAnalytics({
        kind: trackedKind,
        songId,
        campaignId,
        meta: {
          source:
            tracked.dataset
              .analyticsSource ??
            'song_page',
        },
      });
    }

    document.addEventListener(
      'click',
      handleClick,
    );

    return () => {
      document.removeEventListener(
        'click',
        handleClick,
      );
    };
  }, [
    watchClicks,
    songId,
    campaignId,
  ]);

  return null;
}
