import { describe, expect, it } from 'vitest';
import { redemptionDecision } from '@/lib/tickets/redemption-decision';

const EVENT_A = 'event-a';
const EVENT_B = 'event-b';

describe('redemptionDecision', () => {
  it('succeeds for a valid ticket at its own event', () => {
    expect(redemptionDecision({ ticketEventId: EVENT_A, requestedEventId: EVENT_A, status: 'valid' })).toBe('success');
  });

  it('reports already_checked_in for a ticket already redeemed at its own event', () => {
    expect(redemptionDecision({ ticketEventId: EVENT_A, requestedEventId: EVENT_A, status: 'checked_in' })).toBe(
      'already_checked_in',
    );
  });

  it('reports void for a voided ticket at its own event', () => {
    expect(redemptionDecision({ ticketEventId: EVENT_A, requestedEventId: EVENT_A, status: 'void' })).toBe('void');
  });

  it('reports wrong_event for a valid ticket scanned at a different event', () => {
    expect(redemptionDecision({ ticketEventId: EVENT_A, requestedEventId: EVENT_B, status: 'valid' })).toBe('wrong_event');
  });

  it('wrong_event takes priority over the ticket\'s own status — a checked-in ticket at the wrong door reports wrong_event, not already_checked_in', () => {
    expect(redemptionDecision({ ticketEventId: EVENT_A, requestedEventId: EVENT_B, status: 'checked_in' })).toBe(
      'wrong_event',
    );
  });

  it('wrong_event also takes priority for a voided ticket at the wrong door', () => {
    expect(redemptionDecision({ ticketEventId: EVENT_A, requestedEventId: EVENT_B, status: 'void' })).toBe('wrong_event');
  });
});
