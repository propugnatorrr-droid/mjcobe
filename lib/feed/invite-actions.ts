'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { requireAdminRole } from '@/lib/admin/guard';
import { recordAudit } from '@/lib/audit/log';
import { str } from '@/lib/checkout/validate';
import { createSubmissionInvite, sendSubmissionInviteEmail, revokeInvite } from '@/lib/feed/invites';
import type { AdminState } from '@/lib/admin/actions';

/** Issuing a submission invite is a partnership relationship decision, not
 * general content moderation — scoped separately from the feed's
 * MODERATION_ROLES in lib/feed/admin-actions.ts. */
const INVITE_ROLES = ['partnership_admin'] as const;

const MIN_EXPIRY_DAYS = 1;
const MAX_EXPIRY_DAYS = 90;
const DEFAULT_EXPIRY_DAYS = 14;

function parseExpiryDays(raw: string | null): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_EXPIRY_DAYS;
  return Math.min(MAX_EXPIRY_DAYS, Math.max(MIN_EXPIRY_DAYS, Math.round(parsed)));
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export async function issueSubmissionInvite(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...INVITE_ROLES]);

  const sponsorId = str(formData.get('sponsorId'), 100);
  const recipientEmail = str(formData.get('recipientEmail'), 254);
  if (!sponsorId || !recipientEmail) return { error: 'missing' };
  if (!isValidEmail(recipientEmail)) return { error: 'invalid_email' };

  const [sponsor] = await db
    .select({ id: s.sponsors.id, businessName: s.sponsors.businessName, moderation: s.sponsors.moderation })
    .from(s.sponsors)
    .where(eq(s.sponsors.id, sponsorId))
    .limit(1);

  if (!sponsor) return { error: 'not_found' };
  // A sponsor must already be a trusted, approved brand before it can be
  // handed a link that lets it publish directly to the public feed queue.
  if (sponsor.moderation !== 'approved') return { error: 'sponsor_not_approved' };

  const expiresInDays = parseExpiryDays(str(formData.get('expiresInDays'), 10));

  const invite = await createSubmissionInvite({ sponsorId, adminId: me.id, expiresInDays });

  await sendSubmissionInviteEmail({
    inviteId: invite.id,
    sponsorId,
    businessName: sponsor.businessName,
    recipientEmail,
    token: invite.token,
    expiresAt: invite.expiresAt,
  });

  await recordAudit({
    adminUserId: me.id,
    action: 'brand_submission_invite.issue',
    entity: 'brand_submission_invite',
    entityId: invite.id,
    after: { sponsorId, recipientEmail, expiresAt: invite.expiresAt.toISOString() },
  });

  revalidatePath('/admin/feed/invites');

  return { ok: 'saved' };
}

export async function revokeSubmissionInvite(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...INVITE_ROLES]);

  const inviteId = str(formData.get('inviteId'), 100);
  if (!inviteId) return { error: 'missing' };

  const [invite] = await db
    .select({ id: s.brandSubmissionInvites.id, usedAt: s.brandSubmissionInvites.usedAt })
    .from(s.brandSubmissionInvites)
    .where(eq(s.brandSubmissionInvites.id, inviteId))
    .limit(1);

  if (!invite) return { error: 'not_found' };
  if (invite.usedAt) return { error: 'already_used' };

  await revokeInvite(inviteId);

  await recordAudit({
    adminUserId: me.id,
    action: 'brand_submission_invite.revoke',
    entity: 'brand_submission_invite',
    entityId: inviteId,
  });

  revalidatePath('/admin/feed/invites');

  return { ok: 'saved' };
}

/** Resend never reuses the original token (it was never stored, only its
 * hash) — it revokes the old invite and issues a brand new one to the same
 * sponsor, so only one usable link is ever outstanding per resend. */
export async function resendSubmissionInvite(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...INVITE_ROLES]);

  const inviteId = str(formData.get('inviteId'), 100);
  const recipientEmail = str(formData.get('recipientEmail'), 254);
  if (!inviteId || !recipientEmail) return { error: 'missing' };
  if (!isValidEmail(recipientEmail)) return { error: 'invalid_email' };

  const [invite] = await db
    .select({
      id: s.brandSubmissionInvites.id,
      sponsorId: s.brandSubmissionInvites.sponsorId,
      usedAt: s.brandSubmissionInvites.usedAt,
      revokedAt: s.brandSubmissionInvites.revokedAt,
    })
    .from(s.brandSubmissionInvites)
    .where(eq(s.brandSubmissionInvites.id, inviteId))
    .limit(1);

  if (!invite) return { error: 'not_found' };
  if (invite.usedAt) return { error: 'already_used' };

  const [sponsor] = await db
    .select({ businessName: s.sponsors.businessName, moderation: s.sponsors.moderation })
    .from(s.sponsors)
    .where(eq(s.sponsors.id, invite.sponsorId))
    .limit(1);

  if (!sponsor) return { error: 'not_found' };
  if (sponsor.moderation !== 'approved') return { error: 'sponsor_not_approved' };

  if (!invite.revokedAt) {
    await revokeInvite(inviteId);
  }

  const fresh = await createSubmissionInvite({ sponsorId: invite.sponsorId, adminId: me.id });

  await sendSubmissionInviteEmail({
    inviteId: fresh.id,
    sponsorId: invite.sponsorId,
    businessName: sponsor.businessName,
    recipientEmail,
    token: fresh.token,
    expiresAt: fresh.expiresAt,
  });

  await recordAudit({
    adminUserId: me.id,
    action: 'brand_submission_invite.resend',
    entity: 'brand_submission_invite',
    entityId: fresh.id,
    before: { supersededInviteId: inviteId },
    after: { sponsorId: invite.sponsorId, recipientEmail, expiresAt: fresh.expiresAt.toISOString() },
  });

  revalidatePath('/admin/feed/invites');

  return { ok: 'saved' };
}
