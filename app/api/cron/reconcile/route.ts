import {
  runReconciliation,
} from '@/lib/reconciliation/run';

export const dynamic =
  'force-dynamic';

export const maxDuration = 60;

export async function GET(
  request: Request,
) {
  const secret =
    process.env.CRON_SECRET?.trim();

  if (!secret) {
    return Response.json(
      {
        ok: false,
        error:
          'CRON_SECRET is not configured.',
      },
      { status: 503 },
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
      { status: 401 },
    );
  }

  const report =
    await runReconciliation(50);

  return Response.json({
    ok: true,
    ...report,
  });
}
