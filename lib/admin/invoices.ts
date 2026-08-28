export type AdminInvoiceRow = {
  id: string;
  sponsorId: string | null;
  contributionId: string | null;
  number: number;
  amountCents: number;
  status: 'draft' | 'issued' | 'paid' | 'void';
  pdfPath: string | null;
  issuedAt: Date | null;
  createdAt: Date;
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
