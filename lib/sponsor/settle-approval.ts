import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import {
  sponsorAutoDecision,
} from '@/lib/sponsor/auto-approval';

/**
 * Applies the automatic sponsor decision after a business contribution has
 * settled. Runs outside the settlement transaction: publishing a sponsor must
 * never be able to roll back a captured payment.
 */
export async function autoApproveSettledSponsor(
  input: {
    contributionId: string;
    sponsorId: string;
  },
): Promise<void> {
  const [sponsor] = await db
    .select({
      id: s.sponsors.id,
      businessName:
        s.sponsors.businessName,
      moderation:
        s.sponsors.moderation,
      approvedAt:
        s.sponsors.approvedAt,
      supportedSince:
        s.sponsors.supportedSince,
    })
    .from(s.sponsors)
    .where(
      eq(
        s.sponsors.id,
        input.sponsorId,
      ),
    )
    .limit(1);

  if (!sponsor) {
    return;
  }

  const decision =
    sponsorAutoDecision({
      businessName:
        sponsor.businessName,
      currentSponsorModeration:
        sponsor.moderation,
    });

  const now = new Date();

  await dbw.transaction(async (tx) => {
    await tx
      .update(s.sponsors)
      .set({
        moderation:
          decision.sponsorModeration,
        approvedAt:
          decision.sponsorModeration ===
          'approved'
            ? sponsor.approvedAt ?? now
            : sponsor.approvedAt,
        supportedSince:
          sponsor.supportedSince ?? now,
      })
      .where(
        eq(
          s.sponsors.id,
          input.sponsorId,
        ),
      );

    await tx
      .update(s.contributions)
      .set({
        moderation:
          decision.contributionModeration,
        leaderboardVisible:
          decision.leaderboardVisible,
      })
      .where(
        eq(
          s.contributions.id,
          input.contributionId,
        ),
      );
  });
}
