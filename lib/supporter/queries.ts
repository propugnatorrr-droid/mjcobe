import 'server-only';
import { cache } from 'react';
import { asc, eq, sql } from 'drizzle-orm';
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

  /*
   * Public figures are net ledger balances over
   * real, non-test, non-anonymous contributions.
   * A refund removes money from this profile, and
   * a simulated payment was never money at all.
   */
  const [totalRows, songRows, badgeRows] = await Promise.all([
    db.execute(sql`
      select coalesce(sum(l.amount_cents), 0)::int as cents
      from ledger_entries l
      join contributions c on c.id = l.contribution_id
      where c.supporter_id = ${id}
        and c.support_type = 'fan'
        and c.is_test = false
        and c.is_anonymous = false
    `),
    db.execute(sql`
      with per_song as (
        select
          c.song_id,
          coalesce(sum(l.amount_cents), 0)::int as contributed_cents
        from contributions c
        join ledger_entries l on l.contribution_id = c.id
        where c.supporter_id = ${id}
          and c.support_type = 'fan'
          and c.is_test = false
          and c.is_anonymous = false
        group by c.song_id
        having coalesce(sum(l.amount_cents), 0) > 0
      )
      select so.id, so.slug, so.title, ma.path as cover_path,
        per_song.contributed_cents
      from per_song
      join songs so on so.id = per_song.song_id
      left join media_assets ma on ma.id = so.cover_asset_id
      order by per_song.contributed_cents desc, so.title asc
    `),
    db
      .select({ key: s.badges.key, label: s.badges.label })
      .from(s.badgeGrants)
      .innerJoin(s.badges, eq(s.badges.id, s.badgeGrants.badgeId))
      .where(eq(s.badgeGrants.supporterId, id))
      .orderBy(asc(s.badges.sortIndex), asc(s.badges.key)),
  ]);


  const totalContributionsCents = Number(
    ((totalRows as unknown as { rows: Record<string, unknown>[] }).rows[0]?.cents as number) ?? 0,
  );

  if (totalContributionsCents <= 0) return null;

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
    /*
     * The same badge can be earned on several
     * campaigns. A profile shows each mark once.
     */
    badges: [
      ...new Map(
        badgeRows.map((badge) => [
          badge.key,
          badge,
        ]),
      ).values(),
    ],
  };
});

