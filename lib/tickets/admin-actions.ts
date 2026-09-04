'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminRole } from '@/lib/admin/guard';
import { recordAudit } from '@/lib/audit/log';
import { str } from '@/lib/checkout/validate';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { redeemTicket, reverseCheckIn, voidTicket, reissueTicket } from '@/lib/tickets/checkin';
import { sendTicketOrderConfirmation } from '@/lib/tickets/notify';
import { retryNotification } from '@/lib/notifications/outbox';
import type { AdminState } from '@/lib/admin/actions';

/** Scanning/redeeming is the check-in role per the launch role table
 * ("moderator: feed moderation and ticket check-in"). Voiding/reissuing a
 * ticket isn't named explicitly there — it sits between "check-in"
 * (moderator) and "order details" (finance_admin, since it's often a
 * refund's downstream effect), so both are allowed, the same broadest-
 * reasonable-reading resolution Batch C used for an equivalent role-table
 * gap on feed moderation. */
const CHECKIN_ROLES = ['moderator'] as const;
const ATTENDEE_MANAGEMENT_ROLES = ['moderator', 'finance_admin'] as const;

export type CheckInState = {
  outcome?: string;
  ticketId?: string;
  checkedInAt?: string;
  attendeeLabel?: string | null;
  error?: string;
};

export async function checkInTicketAction(_prev: CheckInState, formData: FormData): Promise<CheckInState> {
  const me = await requireAdminRole([...CHECKIN_ROLES]);

  const rawCode = str(formData.get('code'), 300);
  const eventId = str(formData.get('eventId'), 100);
  if (!rawCode || !eventId) return { error: 'missing' };

  const result = await redeemTicket({ rawCode, eventId, adminId: me.id });

  if (result.outcome === 'success') {
    return {
      outcome: 'success',
      ticketId: result.ticketId,
      checkedInAt: result.checkedInAt.toISOString(),
      attendeeLabel: result.attendeeLabel,
    };
  }

  if (result.outcome === 'already_checked_in') {
    return { outcome: 'already_checked_in', ticketId: result.ticketId, checkedInAt: result.checkedInAt?.toISOString() };
  }

  if (result.outcome === 'void') {
    return { outcome: 'void', ticketId: result.ticketId };
  }

  if (result.outcome === 'wrong_event') {
    return { outcome: 'wrong_event', ticketId: result.ticketId };
  }

  return { outcome: 'invalid' };
}

export async function reverseCheckInAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...ATTENDEE_MANAGEMENT_ROLES]);

  const ticketId = str(formData.get('ticketId'), 100);
  const reason = str(formData.get('reason'), 500);
  if (!ticketId || !reason) return { error: 'missing' };

  const result = await reverseCheckIn({ ticketId, adminId: me.id, reason });
  if (!result.ok) return { error: result.code };

  await recordAudit({
    adminUserId: me.id,
    action: 'ticket.reverse_check_in',
    entity: 'ticket',
    entityId: ticketId,
    reason,
  });

  revalidatePath('/admin/check-in');

  return { ok: 'saved' };
}

export async function voidTicketAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...ATTENDEE_MANAGEMENT_ROLES]);

  const ticketId = str(formData.get('ticketId'), 100);
  const eventId = str(formData.get('eventId'), 100);
  const reason = str(formData.get('reason'), 500);
  if (!ticketId || !reason) return { error: 'missing' };

  const result = await voidTicket({ ticketId, adminId: me.id, reason });
  if (!result.ok) return { error: result.code };

  await recordAudit({
    adminUserId: me.id,
    action: 'ticket.void',
    entity: 'ticket',
    entityId: ticketId,
    reason,
  });

  if (eventId) revalidatePath(`/admin/events/${eventId}/attendees`);

  return { ok: 'saved' };
}

/** Resends the ticket confirmation email for an order — reuses the
 * existing notification row (found by its dedupe key) via
 * retryNotification(), the same admin-resend primitive already proven
 * for contribution confirmations, rather than re-queuing a duplicate. If
 * no notification row exists yet (email was never sent at all, e.g. it
 * failed before the outbox row was even created), falls back to queuing
 * fresh via sendTicketOrderConfirmation(). */
export async function resendTicketEmailAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...ATTENDEE_MANAGEMENT_ROLES]);

  const orderId = str(formData.get('orderId'), 100);
  if (!orderId) return { error: 'missing' };

  const dedupeKey = `ticket_order_confirmation:${orderId}`;
  const [existing] = await db.select({ id: s.notifications.id }).from(s.notifications).where(eq(s.notifications.dedupeKey, dedupeKey)).limit(1);

  if (existing) {
    const result = await retryNotification(existing.id);
    if (!result.ok) return { error: result.error ?? 'failed' };
  } else {
    await sendTicketOrderConfirmation(orderId);
  }

  await recordAudit({
    adminUserId: me.id,
    action: 'commerce_order.resend_tickets',
    entity: 'commerce_order',
    entityId: orderId,
  });

  revalidatePath(`/admin/orders/${orderId}`);

  return { ok: 'saved' };
}

export async function reissueTicketAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...ATTENDEE_MANAGEMENT_ROLES]);

  const ticketId = str(formData.get('ticketId'), 100);
  const eventId = str(formData.get('eventId'), 100);
  const reason = str(formData.get('reason'), 500);
  if (!ticketId || !reason) return { error: 'missing' };

  const result = await reissueTicket({ ticketId, adminId: me.id, reason });
  if (!result.ok) return { error: result.code };

  await recordAudit({
    adminUserId: me.id,
    action: 'ticket.reissue',
    entity: 'ticket',
    entityId: ticketId,
    reason,
    after: { newTicketId: result.newTicketId },
  });

  if (eventId) revalidatePath(`/admin/events/${eventId}/attendees`);

  return { ok: 'saved' };
}
