'use client';

import {
  useEffect,
} from 'react';
import {
  useRouter,
} from 'next/navigation';

const REFRESH_INTERVAL_MS =
  2_000;

const MAX_REFRESHES = 15;

export function PaymentStatusRefresh() {
  const router = useRouter();

  useEffect(() => {
    let refreshes = 0;
    let timeout:
      number | null = null;
    let stopped = false;

    function clearScheduledRefresh() {
      if (timeout !== null) {
        window.clearTimeout(
          timeout,
        );

        timeout = null;
      }
    }

    function scheduleRefresh() {
      clearScheduledRefresh();

      if (
        stopped ||
        refreshes >=
          MAX_REFRESHES ||
        document.visibilityState !==
          'visible'
      ) {
        return;
      }

      timeout =
        window.setTimeout(
          () => {
            if (
              stopped ||
              document
                .visibilityState !==
                'visible'
            ) {
              return;
            }

            refreshes += 1;
            router.refresh();
            scheduleRefresh();
          },
          REFRESH_INTERVAL_MS,
        );
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        'visible'
      ) {
        scheduleRefresh();
      } else {
        clearScheduledRefresh();
      }
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    );

    scheduleRefresh();

    return () => {
      stopped = true;

      clearScheduledRefresh();

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      );
    };
  }, [router]);

  return null;
}
