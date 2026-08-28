import {
  deliverDueNotifications,
} from '@/lib/notifications/outbox';

export const dynamic =
  'force-dynamic';

export const maxDuration = 60;

export async function GET(
  request: Request,
) {
  const secret =
    process.env.CRON_SECRET
      ?.trim();

  if (!secret) {
    return Response.json(
      {
        ok: false,
        error:
          'CRON_SECRET is not configured.',
      },
      {
        status: 503,
      },
    );
  }

  if (
    request.headers.get(
      'authorization',
    ) !== `Bearer ${secret}`
  ) {
    return Response.json(
      {
        ok: false,
        error: 'Unauthorized.',
      },
      {
        status: 401,
      },
    );
  }

  const result =
    await deliverDueNotifications(
      25,
    );

  return Response.json({
    ok: true,
    ...result,
  });
}
