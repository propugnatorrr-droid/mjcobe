import 'server-only';
import { cache } from 'react';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';

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
};

/** The global timeline: every visible journey event across every song,
 * newest first. Per-song journeys are a filtered view of the same table. */
export const getGlobalJourney = cache(async (): Promise<JourneyEntry[]> => {
  const rows = await db
    .select({
      id: s.journeyEvents.id,
      kind: s.journeyEvents.kind,
      title: s.journeyEvents.title,
      body: s.journeyEvents.body,
      occurredAt: s.journeyEvents.occurredAt,
      songTitle: s.songs.title,
      songSlug: s.songs.slug,
    })
    .from(s.journeyEvents)
    .leftJoin(s.songs, eq(s.songs.id, s.journeyEvents.songId))
    .where(eq(s.journeyEvents.isVisible, true))
    .orderBy(desc(s.journeyEvents.occurredAt));

  return rows;
});
