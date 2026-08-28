import 'server-only';
import { cache } from 'react';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

export type CatalogSong = {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'building' | 'coming_soon' | 'released' | 'vault';
  description: string | null;
  coverPath: string | null;
  coverPlaceholder: string | null;
  audioPath: string | null;
  previewStartMs: number;
  previewEndMs: number;
  allowFullPlayback: boolean;
  spotifyUrl: string | null;
  appleMusicUrl: string | null;
  youtubeUrl: string | null;
  campaignId: string | null;
  raisedCents: number;
  goalCents: number;
  percent: number;
  supporterCount: number;
};


/** Every published song, with its live campaign's real totals if it has one.
 * One query, reused by the home page's featured card and the full /music
 * catalog. */
export const listCatalog = cache(async (): Promise<CatalogSong[]> => {
  const result = await db.execute(sql`
    select
      so.id, so.slug, so.title, so.status::text as status, so.description,
      ma.path as cover_path, ma.placeholder as cover_placeholder,
aa.path as audio_path,
so.preview_start_ms,
so.preview_end_ms,
so.allow_full_playback,
      so.spotify_url, so.apple_music_url, so.youtube_url,
      cp.id as campaign_id,
      coalesce(fan.cents, 0)::int as raised_cents,
      coalesce(cp.goal_cents, 0)::int as goal_cents,
      coalesce(fan.supporters, 0)::int as supporter_count
    from songs so
    left join media_assets ma on ma.id = so.cover_asset_id
    left join media_assets aa on aa.id = so.audio_asset_id
    left join lateral (
      select cp.* from campaigns cp
      where cp.song_id = so.id
      order by case cp.status when 'live' then 0 when 'funded' then 1 else 2 end,
               cp.created_at desc
      limit 1
    ) cp on true
    left join lateral (
      select
        sum(l.amount_cents)::int as cents,
        count(distinct c.supporter_id)::int as supporters
      from ledger_entries l
      join contributions c on c.id = l.contribution_id
      where l.campaign_id = cp.id and c.support_type = 'fan'
    ) fan on true
    where so.is_published = true
    order by so.sort_index asc
  `);

  return (result as unknown as { rows: Record<string, unknown>[] }).rows.map((r) => {
    const raisedCents = Number(r.raised_cents ?? 0);
    const goalCents = Number(r.goal_cents ?? 0);
    return {
      id: String(r.id),
      slug: String(r.slug),
      title: String(r.title),
      status: r.status as CatalogSong['status'],
      description: r.description ? String(r.description) : null,
      coverPath: r.cover_path ? String(r.cover_path) : null,
      coverPlaceholder: r.cover_placeholder ? String(r.cover_placeholder) : null,
      audioPath: r.audio_path ? String(r.audio_path) : null,
      previewStartMs: Number(r.preview_start_ms ?? 0),
      previewEndMs: Number(r.preview_end_ms ?? 30_000),
      allowFullPlayback:
  r.allow_full_playback === true,
      spotifyUrl: r.spotify_url ? String(r.spotify_url) : null,
      appleMusicUrl: r.apple_music_url ? String(r.apple_music_url) : null,
      youtubeUrl: r.youtube_url ? String(r.youtube_url) : null,
      campaignId: r.campaign_id ? String(r.campaign_id) : null,
      raisedCents,
      goalCents,
      percent: goalCents > 0 ? Math.floor((raisedCents / goalCents) * 100) : 0,
      supporterCount: Number(r.supporter_count ?? 0),
    };
  });
});
