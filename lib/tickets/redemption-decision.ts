/**
 * Pure decision function for what a check-in attempt should report, given
 * a resolved ticket row. Split out so it's unit-testable without a
 * database, matching this repo's convention.
 *
 * This does NOT decide whether the redemption itself succeeds under
 * concurrency — that's the job of the atomic `UPDATE ... WHERE status =
 * 'valid'` in lib/tickets/checkin.ts, which Postgres's own row-level
 * locking makes race-safe. This function only classifies the *result*:
 * given the ticket's state read back after the UPDATE (or before it, for
 * the wrong-event pre-check), which outcome to surface.
 */
export type TicketStatus = 'valid' | 'checked_in' | 'void';

export type RedemptionOutcome = 'success' | 'already_checked_in' | 'void' | 'wrong_event';

export function redemptionDecision(input: {
  ticketEventId: string;
  requestedEventId: string;
  status: TicketStatus;
}): RedemptionOutcome {
  // Event scoping is checked first — a ticket for the wrong event is
  // rejected regardless of its own status, so a door scanner for Event A
  // never reports "already checked in" for a ticket that was never valid
  // at that door in the first place.
  if (input.ticketEventId !== input.requestedEventId) return 'wrong_event';
  if (input.status === 'void') return 'void';
  if (input.status === 'checked_in') return 'already_checked_in';
  return 'success';
}
