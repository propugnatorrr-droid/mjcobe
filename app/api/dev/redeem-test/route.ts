import { redeemTicket } from '@/lib/tickets/checkin';

export const dynamic = 'force-dynamic';

/**
 * Test-only harness for scripts/test-ticket-concurrency.ts. redeemTicket()
 * lives behind modules marked 'server-only' (lib/db/write.ts etc.), which
 * throw immediately when imported from a plain Node script outside
 * Next.js's "react-server" module condition — the same constraint every
 * other lib/**\/*.ts file in this codebase has. Calling it here, inside
 * the actual Next.js server runtime, is what lets the concurrency test
 * exercise the real code path instead of reimplementing it.
 *
 * Hard-blocked in production (NODE_ENV check, not just a secret) AND
 * requires the same CRON_SECRET bearer token the existing cron routes
 * use — two independent gates, neither of which is "this route doesn't
 * exist," but together they mean nothing can reach this outside a
 * deliberate local/staging test run with the secret in hand.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not available in production.' }, { status: 404 });
  }

  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return Response.json({ error: 'CRON_SECRET is not configured.' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { rawCode?: string; eventId?: string; adminId?: string } | null;
  if (!body?.rawCode || !body.eventId || !body.adminId) {
    return Response.json({ error: 'Missing rawCode, eventId, or adminId.' }, { status: 400 });
  }

  try {
    const result = await redeemTicket({ rawCode: body.rawCode, eventId: body.eventId, adminId: body.adminId });
    return Response.json(result);
  } catch (error) {
    return Response.json({ outcome: 'error', error: String(error) }, { status: 500 });
  }
}
