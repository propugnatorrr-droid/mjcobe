import 'server-only';
import { cache } from 'react';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

export type ActivityEntry = {
  id: string;
  name: string;
  isAnonymous: boolean;
  supportType: 'fan' | 'business';
  amountCents: number;
  hideAmount: boolean;
  songTitle: string;
  occurredAt: Date;
};

/** Real recent settled contributions, newest first — the /now page's
 * "Happening Now" feed. Never synthesized; an empty campaign just shows
 * fewer rows. */
export const getRecentActivity = cache(async (limit = 6): Promise<ActivityEntry[]> => {
  const rows = await db.execute(sql`
    select
      l.id, l.amount_cents, l.occurred_at,
      c.support_type, c.is_anonymous, c.hide_amount,
      coalesce(c.display_name_snapshot, su.display_name, sp.business_name, 'Someone') as name,
      so.title as song_title
    from ledger_entries l
    join contributions c on c.id = l.contribution_id
    join songs so on so.id = c.song_id
    left join supporters su on su.id = c.supporter_id
    left join sponsors sp on sp.id = c.sponsor_id
    where c.moderation = 'approved' and l.kind = 'contribution'
    order by l.occurred_at desc
    limit ${limit}
  `);

  return (rows as unknown as { rows: Record<string, unknown>[] }).rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    isAnonymous: Boolean(r.is_anonymous),
    supportType: r.support_type as 'fan' | 'business',
    amountCents: Number(r.amount_cents),
    hideAmount: Boolean(r.hide_amount),
    songTitle: String(r.song_title),
    occurredAt: new Date(String(r.occurred_at)),
  }));
});
