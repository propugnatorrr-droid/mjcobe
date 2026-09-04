import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, eq, ne } from 'drizzle-orm';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { verifyTicketCredential, ticketCredential } from '@/lib/tickets/credentials';
import { redemptionDecision, type RedemptionOutcome } from '@/lib/tickets/redemption-decision';

const DISPLAY_CODE_RE = /^[A-Z0-9]{6,10}$/;

type ResolvedLookup =
  | { by: 'credential'; ticketId: string; credentialVersion: number }
  | { by: 'displayCode'; displayCode: string };

/** A scanned QR payload is a full HMAC credential (two dots); manual staff
 * entry is the short display code. Distinguishing them is just shape —
 * neither is trusted until the DB lookup that follows. */
function resolveLookup(rawCode: string): ResolvedLookup | null {
  const trimmed = rawCode.trim();
  if (!trimmed) return null;

  if (trimmed.includes('.')) {
    const verified = verifyTicketCredential(trimmed);
    if (!verified) return null;
    return { by: 'credential', ticketId: verified.ticketId, credentialVersion: verified.credentialVersion };
  }

  const upper = trimmed.toUpperCase();
  if (!DISPLAY_CODE_RE.test(upper)) return null;
  return { by: 'displayCode', displayCode: upper };
}

export type RedeemResult =
  | { outcome: 'success'; ticketId: string; checkedInAt: Date; attendeeLabel: string | null }
  | { outcome: 'already_checked_in'; ticketId: string; checkedInAt: Date | null }
  | { outcome: 'void'; ticketId: string; voidReason: string | null }
  | { outcome: 'wrong_event'; ticketId: string }
  | { outcome: 'invalid' };

/**
 * The one function this whole batch's concurrency requirement is about.
 * Two people showing an identical screenshot both resolve to the same
 * ticket id; whichever request's `UPDATE ... WHERE status = 'valid'`
 * commits first flips the row, and the second's `UPDATE` — re-evaluating
 * its WHERE clause against the now-committed row — matches zero rows.
 * This is Postgres's own row-level locking on UPDATE, not an application-
 * level lock; no `pg_advisory_xact_lock` is needed here (unlike
 * lib/commerce/reservations.ts's capacity check, which needs one because
 * it does a read-then-decide-then-write across multiple rows — this does
 * a single conditional write against one row, which Postgres already
 * serializes correctly on its own).
 *
 * REQUIRED before this is considered production-ready (per the plan's own
 * instruction): a real concurrent-load test — 10+ simultaneous redemption
 * attempts against one ticket, asserting exactly one success — run
 * against an actual Postgres connection. This session has no live
 * database access, so that test has NOT been run; see
 * docs/STANDALONE_COMMERCE_FEED_TICKETING_PROGRESS.md's Batch H section
 * for the ready-to-run script and why it couldn't be executed here.
 */
export async function redeemTicket(input: { rawCode: string; eventId: string; adminId: string }): Promise<RedeemResult> {
  const resolved = resolveLookup(input.rawCode);
  if (!resolved) return { outcome: 'invalid' };

  return dbw.transaction(async (tx) => {
    let ticketRow: typeof s.tickets.$inferSelect | undefined;

    if (resolved.by === 'credential') {
      const [row] = await tx.select().from(s.tickets).where(eq(s.tickets.id, resolved.ticketId)).limit(1);
      // A credential signed under a since-rotated version verifies its
      // HMAC fine (the secret hasn't changed) but must still be rejected
      // — version is part of what was signed, and the row no longer
      // matches it. Same discipline as lib/commerce/orders.ts's
      // getOrderBySecureToken().
      ticketRow = row && row.credentialVersion === resolved.credentialVersion ? row : undefined;
    } else {
      const [row] = await tx.select().from(s.tickets).where(eq(s.tickets.displayCode, resolved.displayCode)).limit(1);
      ticketRow = row;
    }

    if (!ticketRow) return { outcome: 'invalid' };

    const preCheck = redemptionDecision({ ticketEventId: ticketRow.eventId, requestedEventId: input.eventId, status: asStatus(ticketRow.status) });
    if (preCheck === 'wrong_event') return { outcome: 'wrong_event', ticketId: ticketRow.id };

    const now = new Date();

    const [updated] = await tx
      .update(s.tickets)
      .set({ status: 'checked_in', checkedInAt: now, checkedInByAdminId: input.adminId })
      .where(and(eq(s.tickets.id, ticketRow.id), eq(s.tickets.status, 'valid')))
      .returning({ id: s.tickets.id, checkedInAt: s.tickets.checkedInAt, attendeeLabel: s.tickets.attendeeLabel });

    if (updated) {
      await tx.insert(s.ticketCheckIns).values({ ticketId: updated.id, action: 'check_in', adminUserId: input.adminId });
      return { outcome: 'success', ticketId: updated.id, checkedInAt: updated.checkedInAt ?? now, attendeeLabel: updated.attendeeLabel };
    }

    // The UPDATE matched zero rows — re-read inside the same transaction
    // to classify why (another request just won the race, or it was
    // already void). Re-reading rather than trusting the pre-check's
    // status avoids reporting a stale outcome if it changed between the
    // two reads.
    const [current] = await tx.select().from(s.tickets).where(eq(s.tickets.id, ticketRow.id)).limit(1);
    if (!current) return { outcome: 'invalid' };

    const outcome: RedemptionOutcome = redemptionDecision({
      ticketEventId: current.eventId,
      requestedEventId: input.eventId,
      status: asStatus(current.status),
    });

    if (outcome === 'wrong_event') return { outcome: 'wrong_event', ticketId: current.id };
    if (outcome === 'void') return { outcome: 'void', ticketId: current.id, voidReason: current.voidReason };
    return { outcome: 'already_checked_in', ticketId: current.id, checkedInAt: current.checkedInAt };
  });
}

function asStatus(value: string): 'valid' | 'checked_in' | 'void' {
  return value === 'checked_in' || value === 'void' ? value : 'valid';
}

export type ReversalResult = { ok: true } | { ok: false; code: 'not_found' | 'not_checked_in' };

/** "Scanned by mistake" — requires a reason, writes both the state change
 * and its own ticket_check_ins row. */
export async function reverseCheckIn(input: { ticketId: string; adminId: string; reason: string }): Promise<ReversalResult> {
  const [updated] = await dbw
    .update(s.tickets)
    .set({ status: 'valid', checkedInAt: null, checkedInByAdminId: null })
    .where(and(eq(s.tickets.id, input.ticketId), eq(s.tickets.status, 'checked_in')))
    .returning({ id: s.tickets.id });

  if (!updated) {
    const [exists] = await dbw.select({ id: s.tickets.id }).from(s.tickets).where(eq(s.tickets.id, input.ticketId)).limit(1);
    return { ok: false, code: exists ? 'not_checked_in' : 'not_found' };
  }

  await dbw.insert(s.ticketCheckIns).values({ ticketId: input.ticketId, action: 'reversal', adminUserId: input.adminId, reason: input.reason });

  return { ok: true };
}

export type VoidResult = { ok: true } | { ok: false; code: 'not_found' | 'already_void' };

/** A voided ticket's token can never redeem again, regardless of what
 * state it was in before (valid or checked_in) — refund, fraud, or event
 * cancellation are all handled this same way. */
export async function voidTicket(input: { ticketId: string; adminId: string; reason: string }): Promise<VoidResult> {
  const [updated] = await dbw
    .update(s.tickets)
    .set({ status: 'void', voidedAt: new Date(), voidReason: input.reason })
    .where(and(eq(s.tickets.id, input.ticketId), ne(s.tickets.status, 'void')))
    .returning({ id: s.tickets.id });

  if (updated) {
    await dbw.insert(s.ticketCheckIns).values({ ticketId: input.ticketId, action: 'void', adminUserId: input.adminId, reason: input.reason });
    return { ok: true };
  }

  const [exists] = await dbw.select({ id: s.tickets.id }).from(s.tickets).where(eq(s.tickets.id, input.ticketId)).limit(1);
  return { ok: false, code: exists ? 'already_void' : 'not_found' };
}

export type ReissueResult = { ok: true; newTicketId: string } | { ok: false; code: 'not_found' | 'already_void' };

/** Mints a NEW ticket row (new id → new credential, new display code)
 * linked to the same order item, and voids the old one in the same
 * transaction. The old token can never be reused even if it leaks after
 * this — its row's status is 'void' regardless of what credential someone
 * presents for it. */
export async function reissueTicket(input: { ticketId: string; adminId: string; reason: string }): Promise<ReissueResult> {
  return dbw.transaction(async (tx) => {
    const [old] = await tx.select().from(s.tickets).where(eq(s.tickets.id, input.ticketId)).limit(1);
    if (!old) return { ok: false, code: 'not_found' };
    if (old.status === 'void') return { ok: false, code: 'already_void' };

    const displayCode = await uniqueDisplayCodeInTx(tx);

    const [created] = await tx
      .insert(s.tickets)
      .values({
        orderItemId: old.orderItemId,
        eventId: old.eventId,
        ticketTypeId: old.ticketTypeId,
        displayCode,
        attendeeLabel: old.attendeeLabel,
        status: 'valid',
      })
      .returning({ id: s.tickets.id });

    if (!created) throw new Error('Reissued ticket was not created.');

    await tx
      .update(s.tickets)
      .set({ status: 'void', voidedAt: new Date(), voidReason: input.reason })
      .where(eq(s.tickets.id, old.id));

    await tx.insert(s.ticketCheckIns).values([
      { ticketId: old.id, action: 'reissue', adminUserId: input.adminId, reason: input.reason },
      { ticketId: created.id, action: 'reissue', adminUserId: input.adminId, reason: `Reissued from ${old.id}` },
    ]);

    return { ok: true, newTicketId: created.id };
  });
}

const DISPLAY_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

async function uniqueDisplayCodeInTx(tx: Pick<typeof dbw, 'select'>): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const bytes = randomBytes(8);
    let candidate = '';
    for (const byte of bytes) candidate += DISPLAY_CODE_ALPHABET[byte % DISPLAY_CODE_ALPHABET.length];
    const [existing] = await tx.select({ id: s.tickets.id }).from(s.tickets).where(eq(s.tickets.displayCode, candidate)).limit(1);
    if (!existing) return candidate;
  }
  throw new Error('Could not generate a unique ticket display code after 20 attempts.');
}

/** Read-only helper for rendering a ticket's current credential — used by
 * admin resend and the public /tickets/[secureToken] page's "reissue
 * needed" messaging is intentionally NOT here (that page never mutates). */
export function currentTicketCredential(ticketId: string, credentialVersion: number): string {
  return ticketCredential(ticketId, credentialVersion);
}
