import 'server-only';
import { cache } from 'react';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';

export type SupporterBadge = { key: string; label: string };
export type SupporterSong = {
  id: string;
  slug: string;
  title: string;
  coverPath: string | null;
  contributedCents: number;
};

export type SupporterProfile = {
  id: string;
  displayName: string;
  since: Date;
  instagram: string | null;
  tiktok: string | null;
  website: string | null;
  totalContributionsCents: number;
  songs: SupporterSong[];
  badges: SupporterBadge[];
};

/** Public profile for one supporter. Returns null for anyone anonymous,
 * unmoderated, or nonexistent — never fabricated, an honest 404. */
export const getSupporterProfile = cache(async (id: string): Promise<SupporterProfile | null> => {
  const [supporter] = await db
    .select()
    .from(s.supporters)
    .where(eq(s.supporters.id, id))
    .limit(1);

  if (!supporter || supporter.isAnonymous || supporter.moderation !== 'approved') return null;

  const [totalRows, songRows, badgeRows] = await Promise.all([
    db.execute(sql`
      select sum(l.amount_cents)::int as cents
      from ledger_entries l
      join contributions c on c.id = l.contribution_id
      where c.supporter_id = ${id} and c.support_type = 'fan'
    `),
    db.execute(sql`
      select so.id, so.slug, so.title, ma.path as cover_path,
        sum(l.amount_cents)::int as contributed_cents
      from contributions c
      join songs so on so.id = c.song_id
      left join media_assets ma on ma.id = so.cover_asset_id
      join ledger_entries l on l.contribution_id = c.id
      where c.supporter_id = ${id} and c.support_type = 'fan'
      group by so.id, so.slug, so.title, ma.path
      order by contributed_cents desc
    `),
    db
      .select({ key: s.badges.key, label: s.badges.label })
      .from(s.badgeGrants)
      .innerJoin(s.badges, eq(s.badges.id, s.badgeGrants.badgeId))
      .where(eq(s.badgeGrants.supporterId, id)),
  ]);

  const totalContributionsCents = Number(
    ((totalRows as unknown as { rows: Record<string, unknown>[] }).rows[0]?.cents as number) ?? 0,
  );

  const songs = (songRows as unknown as { rows: Record<string, unknown>[] }).rows.map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    coverPath: r.cover_path ? String(r.cover_path) : null,
    contributedCents: Number(r.contributed_cents ?? 0),
  }));

  return {
    id: supporter.id,
    displayName: supporter.displayName ?? 'Supporter',
    since: supporter.createdAt,
    instagram: supporter.linksPublic ? supporter.instagram : null,
    tiktok: supporter.linksPublic ? supporter.tiktok : null,
    website: supporter.linksPublic ? supporter.website : null,
    totalContributionsCents,
    songs,
    badges: badgeRows,
  };
});
