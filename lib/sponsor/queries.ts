import 'server-only';

import {
  cache,
} from 'react';
import {
  and,
  eq,
  sql,
} from 'drizzle-orm';
import {
  db,
} from '@/lib/db/client';
import * as s from '@/lib/db/schema';

export type SponsoredSong = {
  id: string;
  slug: string;
  title: string;
  contributedCents: number;
};

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

/**
 * Only approved sponsors with positive,
 * non-test, approved ledger value are public.
 */
export const getSponsorProfile =
  cache(
    async (
      slug: string,
    ): Promise<
      SponsorProfile | null
    > => {
      const [sponsor] =
        await db
          .select()
          .from(s.sponsors)
          .leftJoin(
            s.mediaAssets,
            eq(
              s.mediaAssets.id,
              s.sponsors
                .logoAssetId,
            ),
          )
          .where(
            and(
              eq(
                s.sponsors.slug,
                slug,
              ),
              eq(
                s.sponsors
                  .moderation,
                'approved',
              ),
            ),
          )
          .limit(1);

      if (!sponsor) {
        return null;
      }

      const songRows =
        await db.execute(sql`
          select
            so.id,
            so.slug,
            so.title,
            coalesce(
              sum(
                l.amount_cents
              ),
              0
            )::int
              as contributed_cents
          from contributions c
          join songs so
            on so.id =
              c.song_id
          join ledger_entries l
            on l.contribution_id =
              c.id
          where
            c.sponsor_id =
              ${sponsor.sponsors.id}
            and c.support_type =
              'business'
            and c.is_test =
              false
            and c.moderation =
              'approved'
            and c.leaderboard_visible =
              true
          group by
            so.id,
            so.slug,
            so.title
          having
            sum(
              l.amount_cents
            ) > 0
          order by
            contributed_cents
              desc,
            so.id asc
        `);

      const songs =
        (
          songRows as unknown as {
            rows: Record<
              string,
              unknown
            >[];
          }
        ).rows.map(
          (row) => ({
            id:
              String(row.id),
            slug:
              String(row.slug),
            title:
              String(row.title),
            contributedCents:
              Number(
                row
                  .contributed_cents ??
                  0,
              ),
          }),
        );

      /*
       * An approved sponsor with no remaining
       * settled backing must not expose an
       * empty public profile.
       */
      if (
        songs.length === 0
      ) {
        return null;
      }

      return {
        id:
          sponsor.sponsors.id,
        businessName:
          sponsor.sponsors
            .businessName,
        logoPath:
          sponsor.media_assets
            ?.path ?? null,
        website:
          sponsor.sponsors
            .website,
        instagram:
          sponsor.sponsors
            .instagram,
        shopUrl:
          sponsor.sponsors
            .shopUrl,
        industry:
          sponsor.sponsors
            .industry,
        description:
          sponsor.sponsors
            .description,
        supportedSince:
          sponsor.sponsors
            .supportedSince,
        songs,
      };
    },
  );
