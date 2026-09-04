/**
 * REQUIRED verification for Batch H (ticket check-in), per the plan's own
 * instruction: "Concurrency test requirement (must pass before ticketing
 * is considered complete): fire two simultaneous redemption requests for
 * the same valid ticket; assert exactly one returns success... repeat
 * under load (10+ concurrent identical requests)."
 *
 * The session that built this batch has no live database connection, so
 * this test has NOT been run — see
 * docs/STANDALONE_COMMERCE_FEED_TICKETING_PROGRESS.md's Batch H section.
 * This script is the ready-to-run deliverable: it seeds its own throwaway
 * event/ticket-type/order/ticket, fires N concurrent redemption attempts
 * against the SAME ticket, asserts exactly one reports 'success' and the
 * rest report 'already_checked_in' with the winner's own checkedInAt, and
 * cleans up everything it created — win or fail.
 *
 * redeemTicket() itself lives behind 'server-only'-guarded modules
 * (lib/db/write.ts etc.) — those throw immediately when imported from a
 * plain Node script outside Next.js's "react-server" module condition,
 * the same constraint every lib/**\/*.ts file in this codebase has. This
 * script therefore does NOT import redeemTicket() directly; it seeds/
 * cleans up via its own raw Neon connection (same pattern as
 * lib/db/seed.ts) and fires its redemption attempts as concurrent HTTP
 * requests against app/api/dev/redeem-test/route.ts, which calls
 * redeemTicket() from inside the actual Next.js server runtime. This
 * tests the real code path, not a reimplementation of it.
 *
 * Prerequisites before running:
 *   1. lib/db/migrations/0016_live_events.sql, 0017_commerce_orders.sql,
 *      and 0018_tickets.sql must be applied to the target database.
 *   2. TICKET_SIGNING_SECRET and CRON_SECRET must be set in .env.local.
 *   3. An admin_users row must exist (the script uses the first one it
 *      finds) — used only as `checked_in_by_admin_id` attribution, not a
 *      real authenticated session.
 *   4. `npm run dev` must be running (default http://localhost:3000 —
 *      override with DEV_SERVER_URL). NODE_ENV must not be 'production'.
 *
 * Run: npm run tickets:test-concurrency
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local', override: true });

import { createHmac } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as s from '../lib/db/schema';

const CONCURRENCY = 15;
const SERVER_URL = process.env.DEV_SERVER_URL ?? 'http://localhost:3000';

function ticketCredential(ticketId: string, credentialVersion: number, secret: string): string {
  const payload = `${ticketId}.${credentialVersion}`;
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not set.');

  const ticketSecret = process.env.TICKET_SIGNING_SECRET;
  if (!ticketSecret) throw new Error('TICKET_SIGNING_SECRET is not set.');

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) throw new Error('CRON_SECRET is not set.');

  const db = drizzle(neon(databaseUrl), { schema: s });

  const [admin] = await db.select({ id: s.adminUsers.id }).from(s.adminUsers).limit(1);
  if (!admin) {
    throw new Error('No admin_users row exists — create one via /admin before running this script.');
  }

  console.log('Seeding a throwaway event, ticket type, order, and ticket...');

  const [event] = await db
    .insert(s.liveEvents)
    .values({
      slug: `concurrency-test-${Date.now()}`,
      title: 'Concurrency Test Event',
      venueName: 'Test Venue',
      startsAt: new Date(Date.now() + 86_400_000),
      timezone: 'America/New_York',
      isPublished: false,
      status: 'scheduled',
      ticketingEnabled: true,
    })
    .returning({ id: s.liveEvents.id });
  if (!event) throw new Error('Failed to create test event.');

  const [ticketType] = await db
    .insert(s.ticketTypes)
    .values({ eventId: event.id, name: 'Test Tier', priceCents: 1000, capacity: 100 })
    .returning({ id: s.ticketTypes.id });
  if (!ticketType) throw new Error('Failed to create test ticket type.');

  const [order] = await db
    .insert(s.commerceOrders)
    .values({
      orderType: 'ticket',
      orderNumber: `TEST-${Date.now()}`,
      buyerEmail: 'concurrency-test@example.com',
      status: 'paid',
      subtotalCents: 1000,
      totalCents: 1000,
    })
    .returning({ id: s.commerceOrders.id });
  if (!order) throw new Error('Failed to create test order.');

  const [orderItem] = await db
    .insert(s.commerceOrderItems)
    .values({
      orderId: order.id,
      itemType: 'ticket_type',
      referenceId: ticketType.id,
      titleSnapshot: 'Concurrency Test Event — Test Tier',
      unitPriceCents: 1000,
      quantity: 1,
      lineTotalCents: 1000,
    })
    .returning({ id: s.commerceOrderItems.id });
  if (!orderItem) throw new Error('Failed to create test order item.');

  const [ticket] = await db
    .insert(s.tickets)
    .values({
      orderItemId: orderItem.id,
      eventId: event.id,
      ticketTypeId: ticketType.id,
      displayCode: `TEST${Date.now().toString(36).toUpperCase()}`,
      status: 'valid',
    })
    .returning({ id: s.tickets.id, credentialVersion: s.tickets.credentialVersion });
  if (!ticket) throw new Error('Failed to create test ticket.');

  const rawCode = ticketCredential(ticket.id, ticket.credentialVersion, ticketSecret);

  console.log(`Seeded ticket ${ticket.id}. Firing ${CONCURRENCY} concurrent redemption requests at ${SERVER_URL}...`);

  async function attempt(): Promise<{ outcome: string; checkedInAt?: string; error?: string }> {
    try {
      const res = await fetch(`${SERVER_URL}/api/dev/redeem-test`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${cronSecret}` },
        body: JSON.stringify({ rawCode, eventId: event.id, adminId: admin.id }),
      });
      const json = (await res.json()) as { outcome: string; checkedInAt?: string; error?: string };
      return json;
    } catch (error) {
      return { outcome: 'error', error: String(error) };
    }
  }

  const results = await Promise.all(Array.from({ length: CONCURRENCY }, attempt));

  const successes = results.filter((r) => r.outcome === 'success');
  const alreadyCheckedIn = results.filter((r) => r.outcome === 'already_checked_in');
  const errors = results.filter((r) => r.outcome === 'error');
  const other = results.filter((r) => !['success', 'already_checked_in', 'error'].includes(r.outcome));

  console.log('');
  console.log(`  success:             ${successes.length}`);
  console.log(`  already_checked_in:  ${alreadyCheckedIn.length}`);
  console.log(`  errors:              ${errors.length}`);
  console.log(`  other:               ${other.length}`);

  // Cleanup before asserting, so a failed assertion still leaves the DB clean.
  await db.delete(s.ticketCheckIns).where(eq(s.ticketCheckIns.ticketId, ticket.id));
  await db.delete(s.tickets).where(eq(s.tickets.id, ticket.id));
  await db.delete(s.commerceOrderItems).where(eq(s.commerceOrderItems.id, orderItem.id));
  await db.delete(s.commerceOrders).where(eq(s.commerceOrders.id, order.id));
  await db.delete(s.ticketTypes).where(eq(s.ticketTypes.id, ticketType.id));
  await db.delete(s.liveEvents).where(eq(s.liveEvents.id, event.id));
  console.log('Cleaned up test rows.');

  if (errors.length > 0) {
    console.error('FAIL: one or more redemption attempts errored (is `npm run dev` running?).');
    for (const e of errors) console.error(e);
    process.exit(1);
  }

  if (other.length > 0) {
    console.error('FAIL: one or more redemption attempts returned an unexpected outcome.');
    for (const r of other) console.error(r);
    process.exit(1);
  }

  if (successes.length !== 1) {
    console.error(`FAIL: expected exactly 1 success, got ${successes.length}.`);
    process.exit(1);
  }

  if (alreadyCheckedIn.length !== CONCURRENCY - 1) {
    console.error(`FAIL: expected ${CONCURRENCY - 1} already_checked_in results, got ${alreadyCheckedIn.length}.`);
    process.exit(1);
  }

  const winnerCheckedInAt = successes[0]?.checkedInAt;
  const mismatched = alreadyCheckedIn.filter((r) => r.checkedInAt !== winnerCheckedInAt);
  if (mismatched.length > 0) {
    console.error(`FAIL: ${mismatched.length} already_checked_in results reported a checkedInAt that doesn't match the winner's.`);
    process.exit(1);
  }

  console.log('');
  console.log(
    `PASS: exactly 1 of ${CONCURRENCY} concurrent redemption attempts succeeded, the rest correctly reported already_checked_in with a matching timestamp.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
