import 'server-only';

import {
  and,
  desc,
  eq,
  inArray,
  lt,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import {
  getEmailProvider,
} from '@/lib/email';
import {
  buildNotificationEmail,
} from '@/lib/email/templates';
import type {
  ConfirmationPayload,
  NotificationKind,
} from '@/lib/email/templates';
import {
  rankForIdentity,
} from '@/lib/checkout/queries';

const MAX_ATTEMPTS = 5;
const STALE_SENDING_MINUTES = 15;

function messageError(
  error: unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message.slice(
      0,
      1000,
    );
  }

  return String(error).slice(
    0,
    1000,
  );
}

function nextAttemptAt(
  attemptCount: number,
): Date {
  const minutes = Math.min(
    60 * 24,
    2 ** Math.max(
      1,
      attemptCount,
    ),
  );

  return new Date(
    Date.now() +
    minutes * 60_000,
  );
}

/**
 * Atomically claims one delivery. This prevents
 * an admin retry and a cron invocation from
 * sending the same notification simultaneously.
 */
async function claimNotification(
  notificationId: string,
) {
  const now = new Date();

  const staleBefore =
    new Date(
      now.getTime() -
      STALE_SENDING_MINUTES *
        60_000,
    );

  const [claimed] =
    await dbw
      .update(s.notifications)
      .set({
        deliveryStatus:
          'sending',
        attemptCount: sql`
          ${s.notifications.attemptCount} + 1
        `,
        lastError: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(
            s.notifications.id,
            notificationId,
          ),

          lt(
            s.notifications.attemptCount,
            MAX_ATTEMPTS,
          ),

          or(
            and(
              inArray(
                s.notifications.deliveryStatus,
                [
                  'pending',
                  'failed',
                ],
              ),
              lte(
                s.notifications.scheduledAt,
                now,
              ),
            ),

            and(
              eq(
                s.notifications.deliveryStatus,
                'sending',
              ),
              lt(
                s.notifications.updatedAt,
                staleBefore,
              ),
            ),
          ),
        ),
      )
      .returning();

  return claimed ?? null;
}

export async function deliverNotification(
  notificationId: string,
): Promise<{
  ok: boolean;
  skipped?: boolean;
  error?: string;
}> {
  const notification =
    await claimNotification(
      notificationId,
    );

  if (!notification) {
    return {
      ok: true,
      skipped: true,
    };
  }

  if (
    !notification
      .recipientEmail
      ?.trim()
  ) {
    const error =
      'Notification has no recipient email address.';

    await dbw
      .update(s.notifications)
      .set({
        deliveryStatus:
          'failed',
        lastError: error,
        scheduledAt:
          nextAttemptAt(
            notification.attemptCount,
          ),
        updatedAt: new Date(),
      })
      .where(
        eq(
          s.notifications.id,
          notification.id,
        ),
      );

    return {
      ok: false,
      error,
    };
  }

  try {
    const provider =
      getEmailProvider();

    const message =
      buildNotificationEmail(
        notification.kind as
          NotificationKind,
        notification
          .recipientEmail,
        notification.payload,
      );

    const result =
      await provider.send(
        message,
        notification.dedupeKey,
      );

    const now = new Date();

    await dbw
      .update(s.notifications)
      .set({
        deliveryStatus:
          'sent',
        providerMessageId:
          result.messageId,
        lastError: null,
        sentAt: now,
        updatedAt: now,
      })
      .where(
        eq(
          s.notifications.id,
          notification.id,
        ),
      );

    return {
      ok: true,
    };
  } catch (error) {
    const description =
      messageError(error);

    await dbw
      .update(s.notifications)
      .set({
        deliveryStatus:
          'failed',
        lastError:
          description,
        scheduledAt:
          nextAttemptAt(
            notification.attemptCount,
          ),
        updatedAt:
          new Date(),
      })
      .where(
        eq(
          s.notifications.id,
          notification.id,
        ),
      );

    console.error(
      '[notification-delivery-failed]',
      {
        notificationId:
          notification.id,
        error: description,
      },
    );

    return {
      ok: false,
      error: description,
    };
  }
}

async function queueContributionConfirmation(
  transactionId: string,
): Promise<string | null> {
  const [row] =
    await dbw
      .select({
        transactionId:
          s.transactions.id,
        transactionState:
          s.transactions.state,
        contributionId:
          s.contributions.id,
        campaignId:
          s.contributions.campaignId,
        supporterId:
          s.contributions.supporterId,
        sponsorId:
          s.contributions.sponsorId,
        supportType:
          s.contributions.supportType,
        amountCents:
          s.contributions.amountCents,
        displayName:
          s.contributions
            .displayNameSnapshot,
        supporterEmail:
          s.supporters.email,
        businessName:
          s.sponsors.businessName,
        sponsorEmail:
          s.sponsors.email,
        songTitle:
          s.songs.title,
        songSlug:
          s.songs.slug,
      })
      .from(s.transactions)
      .innerJoin(
        s.contributions,
        eq(
          s.contributions.id,
          s.transactions.contributionId,
        ),
      )
      .innerJoin(
        s.songs,
        eq(
          s.songs.id,
          s.contributions.songId,
        ),
      )
      .leftJoin(
        s.supporters,
        eq(
          s.supporters.id,
          s.contributions.supporterId,
        ),
      )
      .leftJoin(
        s.sponsors,
        eq(
          s.sponsors.id,
          s.contributions.sponsorId,
        ),
      )
      .where(
        eq(
          s.transactions.id,
          transactionId,
        ),
      )
      .limit(1);

  if (
    !row ||
    row.transactionState !==
      'settled'
  ) {
    return null;
  }

  const recipientEmail =
    (
      row.supportType ===
      'business'
        ? row.sponsorEmail
        : row.supporterEmail
    )
      ?.trim()
      .toLowerCase() ??
    null;

  if (!recipientEmail) {
    return null;
  }

  const numbers =
    await dbw
      .select({
        seriesKey:
          s.supporterNumbers.seriesKey,
        number:
          s.supporterNumbers.number,
      })
      .from(s.supporterNumbers)
      .where(
        eq(
          s.supporterNumbers.contributionId,
          row.contributionId,
        ),
      );

  const [shareLink] =
    await dbw
      .select({
        code:
          s.shareLinks.code,
      })
      .from(s.shareLinks)
      .where(
        eq(
          s.shareLinks.contributionId,
          row.contributionId,
        ),
      )
      .orderBy(
        desc(
          s.shareLinks.createdAt,
        ),
      )
      .limit(1);

  const identityId =
    row.supportType ===
    'business'
      ? row.sponsorId
      : row.supporterId;

  let rank: number | null =
    null;

  if (identityId) {
    try {
      rank =
        await rankForIdentity(
          row.campaignId,
          row.supportType,
          identityId,
        );
    } catch (error) {
      console.error(
        '[notification-rank-failed]',
        {
          transactionId,
          error:
            messageError(error),
        },
      );
    }
  }

  const payload:
  ConfirmationPayload = {
    transactionId:
      row.transactionId,
    contributionId:
      row.contributionId,
    supportType:
      row.supportType,
    songTitle:
      row.songTitle,
    songSlug:
      row.songSlug,
    displayName:
      row.displayName,
    businessName:
      row.businessName,
    amountCents:
      row.amountCents,

    supporterNumber:
      numbers.find(
        (number) =>
          number.seriesKey ===
          'supporter',
      )?.number ?? null,

    foundingNumber:
      numbers.find(
        (number) =>
          number.seriesKey ===
          'founding',
      )?.number ?? null,

    rank,
    thanksToken:
      shareLink?.code ?? null,
  };

  const dedupeKey =
    `settlement:${transactionId}:confirmation`;

  const kind:
  NotificationKind =
    row.supportType ===
    'business'
      ? 'sponsor_confirmation'
      : 'contribution_confirmation';

  const [created] =
    await dbw
      .insert(s.notifications)
      .values({
        supporterId:
          row.supporterId,
        sponsorId:
          row.sponsorId,
        kind,
        dedupeKey,
        recipientEmail,
        payload,
        deliveryStatus:
          'pending',
        scheduledAt:
          new Date(),
        updatedAt:
          new Date(),
      })
      .onConflictDoNothing()
      .returning({
        id:
          s.notifications.id,
      });

  if (created) {
    return created.id;
  }

  const [existing] =
    await dbw
      .select({
        id:
          s.notifications.id,
      })
      .from(s.notifications)
      .where(
        eq(
          s.notifications.dedupeKey,
          dedupeKey,
        ),
      )
      .limit(1);

  return existing?.id ?? null;
}

/**
 * Called only after settlement commits. Delivery
 * failures are deliberately swallowed so an
 * email-provider outage can never roll back or
 * misreport a successful payment.
 */
export async function sendContributionConfirmation(
  transactionId: string,
): Promise<void> {
  try {
    const notificationId =
      await queueContributionConfirmation(
        transactionId,
      );

    if (notificationId) {
      await deliverNotification(
        notificationId,
      );
    }
  } catch (error) {
    console.error(
      '[notification-enqueue-failed]',
      {
        transactionId,
        error:
          messageError(error),
      },
    );
  }
}

export async function retryNotification(
  notificationId: string,
): Promise<{
  ok: boolean;
  error?: string;
}> {
  const [notification] =
    await dbw
      .select({
        id:
          s.notifications.id,
        deliveryStatus:
          s.notifications.deliveryStatus,
      })
      .from(s.notifications)
      .where(
        eq(
          s.notifications.id,
          notificationId,
        ),
      )
      .limit(1);

  if (!notification) {
    return {
      ok: false,
      error:
        'Notification not found.',
    };
  }

  if (
    notification.deliveryStatus ===
    'sent'
  ) {
    return {
      ok: true,
    };
  }

  await dbw
    .update(s.notifications)
    .set({
      deliveryStatus:
        'pending',
      attemptCount: 0,
      lastError: null,
      scheduledAt:
        new Date(),
      updatedAt:
        new Date(),
    })
    .where(
      eq(
        s.notifications.id,
        notificationId,
      ),
    );

  const result =
    await deliverNotification(
      notificationId,
    );

  return {
    ok: result.ok,
    error: result.error,
  };
}

export async function deliverDueNotifications(
  limit = 25,
): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const now = new Date();

  const staleBefore =
    new Date(
      now.getTime() -
      STALE_SENDING_MINUTES *
        60_000,
    );

  const due =
    await dbw
      .select({
        id:
          s.notifications.id,
      })
      .from(s.notifications)
      .where(
        and(
          lt(
            s.notifications.attemptCount,
            MAX_ATTEMPTS,
          ),

          or(
            and(
              inArray(
                s.notifications.deliveryStatus,
                [
                  'pending',
                  'failed',
                ],
              ),
              lte(
                s.notifications.scheduledAt,
                now,
              ),
            ),

            and(
              eq(
                s.notifications.deliveryStatus,
                'sending',
              ),
              lt(
                s.notifications.updatedAt,
                staleBefore,
              ),
            ),
          ),
        ),
      )
      .orderBy(
        s.notifications.scheduledAt,
      )
      .limit(limit);

  let sent = 0;
  let failed = 0;

  for (
    const notification of due
  ) {
    const result =
      await deliverNotification(
        notification.id,
      );

    if (result.skipped) {
      continue;
    }

    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
    }
  }

  return {
    processed:
      sent + failed,
    sent,
    failed,
  };
}
