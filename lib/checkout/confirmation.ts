import 'server-only';

import {
  eq,
  sql,
} from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import {
  rankForIdentity,
} from '@/lib/checkout/queries';
import {
  resolveThanksToken,
} from '@/lib/checkout/tokens';

export type ConfirmationData = {
  token: string;
  contributionId: string;
  campaignId: string;
  supportType: 'fan' | 'business';
  amountCents: number;
  netAmountCents: number;
  hideAmount: boolean;
  isAnonymous: boolean;
  displayName: string | null;
  songTitle: string;
  songSlug: string;
  businessName: string | null;
  sponsorSlug: string | null;
  supporterNumber: number | null;
  foundingNumber: number | null;
  rank: number | null;
  settled: boolean;
  transactionState: string | null;
};

export async function getConfirmationData(
  token: string,
): Promise<ConfirmationData | null> {
  const link =
    await resolveThanksToken(token);

  if (!link?.contributionId) {
    return null;
  }

  const [row] = await db
    .select({
      contributionId:
        s.contributions.id,
      campaignId:
        s.contributions.campaignId,
      supportType:
        s.contributions.supportType,
      amountCents:
        s.contributions.amountCents,
      hideAmount:
        s.contributions.hideAmount,
      isAnonymous:
        s.contributions.isAnonymous,
      displayName:
        s.contributions
          .displayNameSnapshot,
      supporterId:
        s.contributions.supporterId,
      sponsorId:
        s.contributions.sponsorId,
      songTitle: s.songs.title,
      songSlug: s.songs.slug,
      businessName:
        s.sponsors.businessName,
      sponsorSlug:
        s.sponsors.slug,
      transactionState:
        s.transactions.state,
    })
    .from(s.contributions)
    .innerJoin(
      s.songs,
      eq(
        s.songs.id,
        s.contributions.songId,
      ),
    )
    .leftJoin(
      s.sponsors,
      eq(
        s.sponsors.id,
        s.contributions.sponsorId,
      ),
    )
    .leftJoin(
      s.transactions,
      eq(
        s.transactions.contributionId,
        s.contributions.id,
      ),
    )
    .where(
      eq(
        s.contributions.id,
        link.contributionId,
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const [settlement] = await db
    .select({
      netCents: sql<number>`
        coalesce(
          sum(
            ${s.ledgerEntries.amountCents}
          ),
          0
        )::int
      `,
    })
    .from(s.ledgerEntries)
    .where(
      eq(
        s.ledgerEntries.contributionId,
        row.contributionId,
      ),
    );

  const netAmountCents = Math.max(
    0,
    Number(
      settlement?.netCents ?? 0,
    ),
  );

  const settled =
    netAmountCents > 0;

  const base = {
    token,
    contributionId:
      row.contributionId,
    campaignId: row.campaignId,
    supportType: row.supportType,
    amountCents: row.amountCents,
    netAmountCents,
    hideAmount: row.hideAmount,
    isAnonymous: row.isAnonymous,
    displayName: row.displayName,
    songTitle: row.songTitle,
    songSlug: row.songSlug,
    businessName:
      row.businessName ?? null,
    sponsorSlug:
      row.sponsorSlug ?? null,
    transactionState:
      row.transactionState ?? null,
  };

  if (!settled) {
    return {
      ...base,
      supporterNumber: null,
      foundingNumber: null,
      rank: null,
      settled: false,
    };
  }

  const numbers = await db
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

  const identityId =
    row.supportType === 'business'
      ? row.sponsorId
      : row.supporterId;

  const rank = identityId
    ? await rankForIdentity(
        row.campaignId,
        row.supportType,
        identityId,
      )
    : null;

  return {
    ...base,
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
    settled: true,
  };
}
