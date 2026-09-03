import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { deliverNotification } from '@/lib/notifications/outbox';
import { siteUrl } from '@/lib/email/templates';
import type { BrandSubmissionInvitePayload } from '@/lib/email/templates';
import { isInviteUsable } from '@/lib/feed/invite-eligibility';

const DEFAULT_EXPIRY_DAYS = 14;

function generateToken(): string {
  // 32 random bytes (256 bits) — this grants write access (create a public
  // post as a specific sponsor), not just a read lookup, so it gets more
  // entropy than lib/checkout/tokens.ts's 16-byte share-link code.
  return randomBytes(32).toString('base64url');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export type CreatedInvite = {
  id: string;
  /** The plaintext token — returned exactly once, here, at creation. Only
   * its hash is ever persisted. Callers must use this immediately to build
   * the invite email/link and then let it go out of scope. */
  token: string;
  expiresAt: Date;
};

export async function createSubmissionInvite(input: {
  sponsorId: string;
  adminId: string;
  expiresInDays?: number;
}): Promise<CreatedInvite> {
  const token = generateToken();
  const expiresAt = new Date(
    Date.now() + (input.expiresInDays ?? DEFAULT_EXPIRY_DAYS) * 24 * 60 * 60 * 1000,
  );

  const [created] = await dbw
    .insert(s.brandSubmissionInvites)
    .values({
      sponsorId: input.sponsorId,
      tokenHash: hashToken(token),
      createdByAdminId: input.adminId,
      expiresAt,
    })
    .returning({ id: s.brandSubmissionInvites.id });

  if (!created) {
    throw new Error('Failed to create submission invite.');
  }

  return { id: created.id, token, expiresAt };
}

export type ValidInvite = {
  inviteId: string;
  sponsorId: string;
  sponsorBusinessName: string;
};

/**
 * Looks the token up by its hash — the plaintext is never stored, so this
 * is the only way to resolve one. Returns null for anything not currently
 * usable (unknown, expired, revoked, already used) without distinguishing
 * which — the caller shows one generic "this link isn't valid" state,
 * never leaking which specific reason applies to an attacker probing tokens.
 */
export async function validateSubmissionToken(rawToken: string): Promise<ValidInvite | null> {
  if (!rawToken || rawToken.length < 20 || rawToken.length > 200) {
    return null;
  }

  const tokenHash = hashToken(rawToken);

  const [row] = await db
    .select({
      inviteId: s.brandSubmissionInvites.id,
      sponsorId: s.brandSubmissionInvites.sponsorId,
      expiresAt: s.brandSubmissionInvites.expiresAt,
      revokedAt: s.brandSubmissionInvites.revokedAt,
      usedAt: s.brandSubmissionInvites.usedAt,
      sponsorBusinessName: s.sponsors.businessName,
      sponsorModeration: s.sponsors.moderation,
    })
    .from(s.brandSubmissionInvites)
    .innerJoin(s.sponsors, eq(s.sponsors.id, s.brandSubmissionInvites.sponsorId))
    .where(eq(s.brandSubmissionInvites.tokenHash, tokenHash))
    .limit(1);

  if (!row) return null;
  // A sponsor blocked after the invite was issued can no longer redeem it —
  // isInviteUsable re-checks current sponsor state, not just its state at
  // issuance time.
  if (!isInviteUsable(row, row.sponsorModeration, new Date())) return null;

  return { inviteId: row.inviteId, sponsorId: row.sponsorId, sponsorBusinessName: row.sponsorBusinessName };
}

/** Marks the invite used inside the same transaction that creates the
 * resulting post, so a concurrent double-submit with the same token can
 * never create two posts — see lib/feed/submission.ts. */
export async function markInviteUsed(
  tx: Pick<typeof dbw, 'update'>,
  inviteId: string,
  postId: string,
): Promise<boolean> {
  const [updated] = await tx
    .update(s.brandSubmissionInvites)
    .set({ usedAt: new Date(), resultingPostId: postId })
    .where(and(eq(s.brandSubmissionInvites.id, inviteId), isNull(s.brandSubmissionInvites.usedAt)))
    .returning({ id: s.brandSubmissionInvites.id });

  return Boolean(updated);
}

/**
 * Enqueues and immediately attempts delivery of the invite email — the
 * plaintext token exists only in this call stack (it came from
 * createSubmissionInvite's return value) and is embedded into the email
 * body once, here. It is never logged and never re-derivable afterward:
 * if delivery fails, an admin uses resendSubmissionInvite (lib/feed/
 * invite-actions.ts) to issue a fresh invite row/token rather than
 * retrying this exact one.
 */
export async function sendSubmissionInviteEmail(args: {
  inviteId: string;
  sponsorId: string;
  businessName: string;
  recipientEmail: string;
  token: string;
  expiresAt: Date;
}): Promise<void> {
  const payload: BrandSubmissionInvitePayload = {
    businessName: args.businessName,
    submissionUrl: `${siteUrl()}/partners/submit/${encodeURIComponent(args.token)}`,
    expiresAtIso: args.expiresAt.toISOString(),
  };

  const dedupeKey = `brand_submission_invite:${args.inviteId}`;

  const [created] = await dbw
    .insert(s.notifications)
    .values({
      sponsorId: args.sponsorId,
      kind: 'brand_submission_invite',
      dedupeKey,
      recipientEmail: args.recipientEmail,
      payload: payload as unknown as Record<string, unknown>,
      deliveryStatus: 'pending',
      scheduledAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning({ id: s.notifications.id });

  const notificationId =
    created?.id ??
    (
      await dbw
        .select({ id: s.notifications.id })
        .from(s.notifications)
        .where(eq(s.notifications.dedupeKey, dedupeKey))
        .limit(1)
    )[0]?.id;

  if (notificationId) {
    await deliverNotification(notificationId);
  }
}

export async function revokeInvite(inviteId: string): Promise<void> {
  await dbw
    .update(s.brandSubmissionInvites)
    .set({ revokedAt: new Date() })
    .where(eq(s.brandSubmissionInvites.id, inviteId));
}

export async function listInvitesForSponsor(sponsorId: string) {
  return db
    .select()
    .from(s.brandSubmissionInvites)
    .where(eq(s.brandSubmissionInvites.sponsorId, sponsorId))
    .orderBy(s.brandSubmissionInvites.createdAt);
}
