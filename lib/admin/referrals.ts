import 'server-only';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';

export type ReferralLinkRow = {
  id: string;
  code: string;
  label: string | null;
  campaignLabel: string | null;
  visits: number;
  createdAt: Date;
};

export async function listReferralLinks(): Promise<ReferralLinkRow[]> {
  const rows = await db
    .select({
      id: s.referralLinks.id,
      code: s.referralLinks.code,
      label: s.referralLinks.label,
      createdAt: s.referralLinks.createdAt,
      campaignLabel: s.campaigns.name,
      visits: sql<number>`count(${s.referralVisits.id})::int`,
    })
    .from(s.referralLinks)
    .leftJoin(s.campaigns, eq(s.campaigns.id, s.referralLinks.campaignId))
    .leftJoin(s.referralVisits, eq(s.referralVisits.referralLinkId, s.referralLinks.id))
    .groupBy(s.referralLinks.id, s.campaigns.name)
    .orderBy(desc(s.referralLinks.createdAt));

  return rows;
}
