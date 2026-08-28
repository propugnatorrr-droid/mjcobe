import 'server-only';

import {
  and,
  desc,
  eq,
  sql,
} from 'drizzle-orm';
import {
  db,
} from '@/lib/db/client';
import * as s from '@/lib/db/schema';

export type AdminInvoiceRow =
  typeof s.invoices.$inferSelect & {
    songTitle: string | null;
    campaignName: string | null;
  };

export type InvoiceContributionOption = {
  id: string;
  amountCents: number;
  createdAt: Date;
  songTitle: string;
  campaignName: string;
};

export type SponsorInvoiceData = {
  invoices: AdminInvoiceRow[];
  contributions:
    InvoiceContributionOption[];
  nextInvoiceNumber: number;
};

export async function getSponsorInvoices(
  sponsorId: string,
): Promise<SponsorInvoiceData> {
  const [
    invoiceRows,
    contributionRows,
    nextNumberRows,
  ] = await Promise.all([
    db
      .select({
        id: s.invoices.id,
        sponsorId:
          s.invoices.sponsorId,
        contributionId:
          s.invoices.contributionId,
        number:
          s.invoices.number,
        amountCents:
          s.invoices.amountCents,
        status:
          s.invoices.status,
        pdfPath:
          s.invoices.pdfPath,
        issuedAt:
          s.invoices.issuedAt,
        createdAt:
          s.invoices.createdAt,
        songTitle:
          s.songs.title,
        campaignName:
          s.campaigns.name,
      })
      .from(s.invoices)
      .leftJoin(
        s.contributions,
        eq(
          s.contributions.id,
          s.invoices.contributionId,
        ),
      )
      .leftJoin(
        s.campaigns,
        eq(
          s.campaigns.id,
          s.contributions.campaignId,
        ),
      )
      .leftJoin(
        s.songs,
        eq(
          s.songs.id,
          s.contributions.songId,
        ),
      )
      .where(
        eq(
          s.invoices.sponsorId,
          sponsorId,
        ),
      )
      .orderBy(
        desc(
          s.invoices.createdAt,
        ),
      ),

    db
      .select({
        id:
          s.contributions.id,
        amountCents:
          s.contributions.amountCents,
        createdAt:
          s.contributions.createdAt,
        songTitle:
          s.songs.title,
        campaignName:
          s.campaigns.name,
      })
      .from(s.contributions)
      .innerJoin(
        s.campaigns,
        eq(
          s.campaigns.id,
          s.contributions.campaignId,
        ),
      )
      .innerJoin(
        s.songs,
        eq(
          s.songs.id,
          s.contributions.songId,
        ),
      )
      .where(
        and(
          eq(
            s.contributions.sponsorId,
            sponsorId,
          ),
          eq(
            s.contributions.supportType,
            'business',
          ),
        ),
      )
      .orderBy(
        desc(
          s.contributions.createdAt,
        ),
      ),

    db
      .select({
        nextNumber: sql<number>`
          (
            coalesce(
              max(${s.invoices.number}),
              0
            ) + 1
          )::int
        `,
      })
      .from(s.invoices),
  ]);

  return {
    invoices: invoiceRows,
    contributions:
      contributionRows,
    nextInvoiceNumber:
      nextNumberRows[0]
        ?.nextNumber ?? 1,
  };
}
