import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import {
  MILESTONE_EVENT_KIND,
  MILESTONE_JOURNEY_TITLES,
  newMilestones,
} from '@/lib/journey/milestones';
import {
  getCampaignTotals,
} from '@/lib/campaign/queries';

/**
 * Records any milestone the campaign has newly reached, plus its journey
 * entry. Runs after settlement commits, so the ledger already reflects the
 * money. Idempotent through campaign_milestones_unique_idx.
 */
export async function recordCampaignMilestones(
  campaignId: string,
): Promise<string[]> {
  const [campaign] = await db
    .select({
      id: s.campaigns.id,
      songId: s.campaigns.songId,
      goalCents:
        s.campaigns.goalCents,
    })
    .from(s.campaigns)
    .where(
      eq(s.campaigns.id, campaignId),
    )
    .limit(1);

  if (!campaign) {
    return [];
  }

  const [totals, existing] =
    await Promise.all([
      getCampaignTotals(campaignId),
      db
        .select({
          kind: s.campaignMilestones
            .kind,
        })
        .from(s.campaignMilestones)
        .where(
          eq(
            s.campaignMilestones
              .campaignId,
            campaignId,
          ),
        ),
    ]);

  const fresh = newMilestones(
    {
      supporterCount:
        totals.supporterCount,
      raisedCents: totals.fanCents,
      goalCents: campaign.goalCents ?? 0,
    },
    existing.map(
      (row) => String(row.kind),
    ),
  );

  if (fresh.length === 0) {
    return [];
  }

  const reachedAt = new Date();

  await dbw
    .insert(s.campaignMilestones)
    .values(
      fresh.map((kind) => ({
        campaignId,
        kind,
        reachedAt,
        isPublished: true,
      })),
    )
    .onConflictDoNothing();

  await dbw
    .insert(s.journeyEvents)
    .values(
      fresh.map((kind) => ({
        songId: campaign.songId,
        campaignId,
        kind: MILESTONE_EVENT_KIND[
          kind
        ],
        title:
          MILESTONE_JOURNEY_TITLES[
            kind
          ],
        occurredAt: reachedAt,
        isAuto: true,
        isVisible: true,
      })),
    );

  return fresh;
}
