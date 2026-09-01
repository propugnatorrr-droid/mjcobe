import 'server-only';

import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';

/**
 * Campaign lifecycle changes are part of the public story, so opening and
 * closing a campaign writes a journey event rather than silently changing a
 * status field.
 */
export async function recordCampaignLifecycle(
  input: {
    songId: string;
    campaignId: string;
    previousStatus: string;
    nextStatus: string;
    campaignName: string;
  },
): Promise<void> {
  if (
    input.previousStatus ===
    input.nextStatus
  ) {
    return;
  }

  const title =
    input.nextStatus === 'live'
      ? `${input.campaignName} is open for support`
      : input.nextStatus === 'funded'
        ? `${input.campaignName} reached its goal`
        : input.nextStatus === 'closed'
          ? `${input.campaignName} closed`
          : null;

  if (!title) {
    return;
  }

  await dbw
    .insert(s.journeyEvents)
    .values({
      songId: input.songId,
      campaignId: input.campaignId,
      kind:
        input.nextStatus === 'live'
          ? 'campaign_open'
          : 'campaign_close',
      title,
      occurredAt: new Date(),
      isAuto: true,
      isVisible: true,
    });
}
