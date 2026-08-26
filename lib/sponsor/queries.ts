import 'server-only';
import { cache } from 'react';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';

export type SponsoredSong = { id: string; slug: string; title: string; contributedCents: number };

export type SponsorProfile = {
  id: string;
  businessName: string;
  logoPath: string | null;
  website: string | null;
  instagram: string | null;
  shopUrl: string | null;
  industry: string | null;
  description: string | null;
  supportedSince: Date | null;
  songs: SponsoredSong[];
};

/** Public sponsor profile (PRD §13). Unapproved sponsors return null —
 * an honest 404 rather than exposing a pending submission. */
export const getSponsorProfile = cache(async (slug: string): Promise<SponsorProfile | null> => {
  const [sponsor] = await db
    .select()
    .from(s.sponsors)
    .leftJoin(s.mediaAssets, eq(s.mediaAssets.id, s.sponsors.logoAssetId))
    .where(eq(s.sponsors.slug, slug))
    .limit(1);

  if (!sponsor || sponsor.sponsors.moderation !== 'approved') return null;

  const songRows = await db.execute(sql`
    select so.id, so.slug, so.title, sum(l.amount_cents)::int as contributed_cents
    from contributions c
    join songs so on so.id = c.song_id
    join ledger_entries l on l.contribution_id = c.id
    where c.sponsor_id = ${sponsor.sponsors.id} and c.support_type = 'business'
    group by so.id, so.slug, so.title
    order by contributed_cents desc
  `);

  const songs = (songRows as unknown as { rows: Record<string, unknown>[] }).rows.map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    contributedCents: Number(r.contributed_cents ?? 0),
  }));

  return {
    id: sponsor.sponsors.id,
    businessName: sponsor.sponsors.businessName,
    logoPath: sponsor.media_assets?.path ?? null,
    website: sponsor.sponsors.website,
    instagram: sponsor.sponsors.instagram,
    shopUrl: sponsor.sponsors.shopUrl,
    industry: sponsor.sponsors.industry,
    description: sponsor.sponsors.description,
    supportedSince: sponsor.sponsors.supportedSince,
    songs,
  };
});
