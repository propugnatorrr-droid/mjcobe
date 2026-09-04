import { describe, expect, it } from 'vitest';
import { reservationDecision } from '@/lib/commerce/reservation-decision';

describe('reservationDecision', () => {
  it('grants a request that fits within available capacity', () => {
    const result = reservationDecision({ capacity: 100, committed: 0, activeReservations: 0, requestedQuantity: 10 });
    expect(result).toEqual({ ok: true, availableBeforeRequest: 100 });
  });

  it('accounts for both committed (permanently issued) and active reservations', () => {
    const result = reservationDecision({ capacity: 100, committed: 40, activeReservations: 30, requestedQuantity: 30 });
    expect(result).toEqual({ ok: true, availableBeforeRequest: 30 });
  });

  it('rejects a request larger than what remains', () => {
    const result = reservationDecision({ capacity: 100, committed: 40, activeReservations: 30, requestedQuantity: 31 });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('insufficient_capacity');
  });

  it('grants exactly the last unit', () => {
    const result = reservationDecision({ capacity: 10, committed: 9, activeReservations: 0, requestedQuantity: 1 });
    expect(result.ok).toBe(true);
  });

  it('rejects when sold out (available capacity is zero)', () => {
    const result = reservationDecision({ capacity: 10, committed: 10, activeReservations: 0, requestedQuantity: 1 });
    expect(result.ok).toBe(false);
  });

  it('the exact-last-unit race: two simultaneous requests against the same snapshot — only one is grantable', () => {
    // Simulates the moment two concurrent callers read the same committed/
    // activeReservations snapshot before either has inserted its own
    // reservation row (the advisory lock in reserveTicketCapacity is what
    // actually serializes this in production; this test only proves the
    // decision function itself would correctly reject a second request
    // for the same last unit if evaluated against the post-first-grant state).
    const snapshotBeforeEither = { capacity: 5, committed: 0, activeReservations: 4 };
    const first = reservationDecision({ ...snapshotBeforeEither, requestedQuantity: 1 });
    expect(first.ok).toBe(true);

    const snapshotAfterFirstGrant = { capacity: 5, committed: 0, activeReservations: 5 };
    const second = reservationDecision({ ...snapshotAfterFirstGrant, requestedQuantity: 1 });
    expect(second.ok).toBe(false);
  });

  it('rejects a zero quantity request', () => {
    const result = reservationDecision({ capacity: 100, committed: 0, activeReservations: 0, requestedQuantity: 0 });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('invalid_quantity');
  });

  it('rejects a negative quantity request', () => {
    const result = reservationDecision({ capacity: 100, committed: 0, activeReservations: 0, requestedQuantity: -1 });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('invalid_quantity');
  });

  it('an expired reservation does not count against capacity (activeReservations excludes it by construction)', () => {
    // reserveTicketCapacity's own query filters expiresAt > now(), so an
    // expired hold is simply never summed into activeReservations in the
    // first place — this test documents that contract at the decision-
    // function boundary rather than re-deriving expiry logic here.
    const result = reservationDecision({ capacity: 10, committed: 0, activeReservations: 0, requestedQuantity: 10 });
    expect(result.ok).toBe(true);
  });
});
