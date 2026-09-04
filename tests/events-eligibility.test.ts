import { describe, expect, it } from 'vitest';
import { resolveEventCtaState, type EventForCta } from '@/lib/events/eligibility';

const NOW = new Date('2026-06-01T12:00:00Z');

function event(overrides: Partial<EventForCta> = {}): EventForCta {
  return {
    isPublished: true,
    status: 'scheduled',
    ticketingEnabled: true,
    salesStartAt: null,
    salesEndAt: null,
    ...overrides,
  };
}

describe('resolveEventCtaState', () => {
  it('is unpublished when the event has never been published, regardless of everything else', () => {
    expect(resolveEventCtaState(event({ isPublished: false }), NOW)).toBe('unpublished');
  });

  it('is canceled when status is canceled, even if published and ticketing enabled', () => {
    expect(resolveEventCtaState(event({ status: 'canceled' }), NOW)).toBe('canceled');
  });

  it('is postponed when status is postponed', () => {
    expect(resolveEventCtaState(event({ status: 'postponed' }), NOW)).toBe('postponed');
  });

  it('is completed when status is completed', () => {
    expect(resolveEventCtaState(event({ status: 'completed' }), NOW)).toBe('completed');
  });

  it('is ticketing_disabled when the event has no ticketing at all', () => {
    expect(resolveEventCtaState(event({ ticketingEnabled: false }), NOW)).toBe('ticketing_disabled');
  });

  it('is on_sale with no sales window configured', () => {
    expect(resolveEventCtaState(event(), NOW)).toBe('on_sale');
  });

  it('is not_yet_on_sale before the configured sales start', () => {
    expect(
      resolveEventCtaState(event({ salesStartAt: new Date('2026-07-01T00:00:00Z') }), NOW),
    ).toBe('not_yet_on_sale');
  });

  it('is on_sale exactly at the sales start instant', () => {
    expect(resolveEventCtaState(event({ salesStartAt: NOW }), NOW)).toBe('on_sale');
  });

  it('is sales_closed after the configured sales end', () => {
    expect(
      resolveEventCtaState(event({ salesEndAt: new Date('2026-05-01T00:00:00Z') }), NOW),
    ).toBe('sales_closed');
  });

  it('is sales_closed exactly at the sales end instant', () => {
    expect(resolveEventCtaState(event({ salesEndAt: NOW }), NOW)).toBe('sales_closed');
  });

  it('is on_sale between an open sales start and a future sales end', () => {
    expect(
      resolveEventCtaState(
        event({ salesStartAt: new Date('2026-05-01T00:00:00Z'), salesEndAt: new Date('2026-07-01T00:00:00Z') }),
        NOW,
      ),
    ).toBe('on_sale');
  });

  it('lifecycle status is checked before the sales window — a canceled event never reads as on_sale', () => {
    expect(
      resolveEventCtaState(
        event({ status: 'canceled', salesStartAt: new Date('2026-01-01T00:00:00Z'), salesEndAt: new Date('2026-12-01T00:00:00Z') }),
        NOW,
      ),
    ).toBe('canceled');
  });
});
