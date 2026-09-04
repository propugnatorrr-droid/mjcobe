/**
 * Pure decision function for what an event's ticket CTA should say right
 * now — extracted so it's unit-testable without a database, matching this
 * repo's convention (see lib/feed/visibility.ts, lib/feed/
 * invite-eligibility.ts). Keep lib/events/queries.ts's usage in sync if
 * this rule ever changes.
 *
 * Deliberately does NOT include a 'sold_out' state — no order/reservation
 * table exists yet (that's Batch G/H), so this batch cannot know how many
 * tickets of a type have actually been claimed. Once Batch H's issuance
 * exists, sold-out detection belongs here as an additional input
 * (remaining capacity), not bolted on elsewhere.
 */
export type EventCtaState =
  | 'unpublished'
  | 'canceled'
  | 'postponed'
  | 'completed'
  | 'ticketing_disabled'
  | 'not_yet_on_sale'
  | 'on_sale'
  | 'sales_closed';

export type EventForCta = {
  isPublished: boolean;
  status: string;
  ticketingEnabled: boolean;
  salesStartAt: Date | null;
  salesEndAt: Date | null;
};

export function resolveEventCtaState(event: EventForCta, now: Date): EventCtaState {
  if (!event.isPublished) return 'unpublished';
  if (event.status === 'canceled') return 'canceled';
  if (event.status === 'postponed') return 'postponed';
  if (event.status === 'completed') return 'completed';
  if (!event.ticketingEnabled) return 'ticketing_disabled';
  if (event.salesStartAt && event.salesStartAt.getTime() > now.getTime()) return 'not_yet_on_sale';
  if (event.salesEndAt && event.salesEndAt.getTime() <= now.getTime()) return 'sales_closed';
  return 'on_sale';
}
