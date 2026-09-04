import 'server-only';
import { cache } from 'react';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { flagEnabled } from '@/lib/config/settings';

export type JourneyFilter = 'all' | 'milestones' | 'supporters' | 'sponsors';

const SUPPORTER_KINDS = new Set(['supporter_milestone', 'new_top_supporter']);
const SPONSOR_KINDS = new Set(['new_top_sponsor']);

export function journeyGroup(kind: string): Exclude<JourneyFilter, 'all'> {
  if (SUPPORTER_KINDS.has(kind)) return 'supporters';
  if (SPONSOR_KINDS.has(kind)) return 'sponsors';
  return 'milestones';
}

export type JourneyEntry = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  occurredAt: Date;
  songTitle: string | null;
  songSlug: string | null;
  /** Present only when the referenced event is published — an entry
   * pointing at a draft/unpublished event links to nothing rather than a
   * route that would 404, same discipline as the feed's double-gate. */
  eventSlug: string | null;
  eventTitle: string | null;
  imagePath: string | null;
  imagePlaceholder: string | null;
};

/**
 * The global timeline: every visible journey event across every song,
 * newest first. Per-song journeys are a filtered view of the same table.
 *
 * The join to `live_events` only happens when `eventsEnabled` is on — this
 * table exists in the Drizzle schema and in the generated-but-unapplied
 * 0016 migration, but this initiative's standing policy is to generate and
 * review migrations without ever applying them here. In an environment
 * where that migration hasn't been run yet, `.leftJoin(s.liveEvents, ...)`
 * still emits `LEFT JOIN "live_events" ...` in the compiled SQL even when
 * its ON condition is neutered to `false` — the join target itself, not
 * just the condition, has to be conditional, or Postgres throws "relation
 * live_events does not exist" regardless of what the ON clause says. Caught
 * this exact way: a first attempt that only neutered the ON clause still
 * broke `npm run build` against the real dev database. Two separate query
 * bodies (rather than one query with a conditional join) is the correct
 * fix, not a shortcut — it's what actually keeps this already-shipped,
 * always-on query working regardless of migration state, matching how
 * every other new table in this initiative is only ever reached through a
 * flag-gated path.
 */
export const getGlobalJourney = cache(async (): Promise<JourneyEntry[]> => {
  const eventsAvailable = await flagEnabled('eventsEnabled');

  if (!eventsAvailable) {
    const rows = await db
      .select({
        id: s.journeyEvents.id,
        kind: s.journeyEvents.kind,
        title: s.journeyEvents.title,
        body: s.journeyEvents.body,
        occurredAt: s.journeyEvents.occurredAt,
        songTitle: s.songs.title,
        songSlug: s.songs.slug,
        imagePath: s.mediaAssets.path,
        imagePlaceholder: s.mediaAssets.placeholder,
      })
      .from(s.journeyEvents)
      .leftJoin(s.songs, eq(s.songs.id, s.journeyEvents.songId))
      .leftJoin(s.mediaAssets, eq(s.mediaAssets.id, s.journeyEvents.mediaAssetId))
      .where(eq(s.journeyEvents.isVisible, true))
      .orderBy(desc(s.journeyEvents.occurredAt));

    return rows.map((row) => ({ ...row, eventSlug: null, eventTitle: null }));
  }

  const rows = await db
    .select({
      id: s.journeyEvents.id,
      kind: s.journeyEvents.kind,
      title: s.journeyEvents.title,
      body: s.journeyEvents.body,
      occurredAt: s.journeyEvents.occurredAt,
      songTitle: s.songs.title,
      songSlug: s.songs.slug,
      eventSlug: s.liveEvents.slug,
      eventTitle: s.liveEvents.title,
      eventIsPublished: s.liveEvents.isPublished,
      imagePath: s.mediaAssets.path,
      imagePlaceholder: s.mediaAssets.placeholder,
    })
    .from(s.journeyEvents)
    .leftJoin(s.songs, eq(s.songs.id, s.journeyEvents.songId))
    .leftJoin(s.liveEvents, eq(s.liveEvents.id, s.journeyEvents.liveEventId))
    .leftJoin(s.mediaAssets, eq(s.mediaAssets.id, s.journeyEvents.mediaAssetId))
    .where(eq(s.journeyEvents.isVisible, true))
    .orderBy(desc(s.journeyEvents.occurredAt));

  return rows.map(({ eventIsPublished, ...row }) => ({
    ...row,
    eventSlug: eventIsPublished ? row.eventSlug : null,
    eventTitle: eventIsPublished ? row.eventTitle : null,
  }));
});
