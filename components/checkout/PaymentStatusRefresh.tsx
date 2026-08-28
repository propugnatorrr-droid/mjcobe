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

    const interval =
      window.setInterval(
        () => {
          refreshes += 1;
          router.refresh();

          if (
            refreshes >=
            MAX_REFRESHES
          ) {
            window.clearInterval(
              interval,
            );
          }
        },
        REFRESH_INTERVAL_MS,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [router]);

  return null;
}
