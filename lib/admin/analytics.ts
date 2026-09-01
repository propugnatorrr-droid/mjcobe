import 'server-only';

import {
  sql,
} from 'drizzle-orm';
import { db } from '@/lib/db/client';

export type CampaignFunnelRow = {
  campaignId: string;
  campaignName: string;
  songTitle: string;
  views: number;
  listeners: number;
  audioCompletions: number;
  supportClicks: number;
  sponsorClicks: number;
  checkoutStarts: number;
  paymentFailures: number;
  conversions: number;
  revenueCents: number;
  conversionRate: number;
};

type RawRow = {
  campaign_id: string;
  campaign_name: string;
  song_title: string;
  views: number | string;
  listeners: number | string;
  audio_completions:
    number | string;
  support_clicks:
    number | string;
  sponsor_clicks:
    number | string;
  checkout_starts:
    number | string;
  payment_failures:
    number | string;
  conversions:
    number | string;
  revenue_cents:
    number | string;
};

export async function campaignFunnels():
  Promise<
    CampaignFunnelRow[]
  > {
  const result =
    await db.execute<RawRow>(
      sql`
        with event_rollup as (
          select
            campaign_id,

            count(
              distinct session_id
            ) filter (
              where kind =
                'song_page_view'
            )::int as views,

            count(
              distinct session_id
            ) filter (
              where kind =
                'audio_play'
            )::int as listeners,

            count(
              distinct session_id
            ) filter (
              where kind =
                'audio_complete'
            )::int
              as audio_completions,

            count(*) filter (
              where kind =
                'support_click'
            )::int
              as support_clicks,

            count(*) filter (
              where kind =
                'sponsor_click'
            )::int
              as sponsor_clicks,

            count(
              distinct session_id
            ) filter (
              where kind =
                'checkout_start'
            )::int
              as checkout_starts,

            count(*) filter (
              where kind =
                'payment_failure'
            )::int
              as payment_failures

          from analytics_events
          where
            campaign_id is not null
          group by campaign_id
        ),

        contribution_balances as (
          select
            c.id,
            c.campaign_id,
            coalesce(
              sum(
                le.amount_cents
              ),
              0
            )::int as net_cents
          from contributions c
          left join ledger_entries le
            on le.contribution_id =
              c.id
          where
            c.is_test = false
          group by
            c.id,
            c.campaign_id
        ),

        settlement_rollup as (
          select
            campaign_id,

            count(*) filter (
              where net_cents > 0
            )::int
              as conversions,

            coalesce(
              sum(
                greatest(
                  net_cents,
                  0
                )
              ),
              0
            )::int
              as revenue_cents

          from contribution_balances
          group by campaign_id
        )

        select
          campaigns.id
            as campaign_id,
          campaigns.name
            as campaign_name,
          songs.title
            as song_title,

          coalesce(
            event_rollup.views,
            0
          )::int as views,

          coalesce(
            event_rollup.listeners,
            0
          )::int as listeners,

          coalesce(
            event_rollup
              .audio_completions,
            0
          )::int
            as audio_completions,

          coalesce(
            event_rollup
              .support_clicks,
            0
          )::int
            as support_clicks,

          coalesce(
            event_rollup
              .sponsor_clicks,
            0
          )::int
            as sponsor_clicks,

          coalesce(
            event_rollup
              .checkout_starts,
            0
          )::int
            as checkout_starts,

          coalesce(
            event_rollup
              .payment_failures,
            0
          )::int
            as payment_failures,

          coalesce(
            settlement_rollup
              .conversions,
            0
          )::int
            as conversions,

          coalesce(
            settlement_rollup
              .revenue_cents,
            0
          )::int
            as revenue_cents

        from campaigns

        join songs
          on songs.id =
            campaigns.song_id

        left join event_rollup
          on event_rollup.campaign_id =
            campaigns.id

        left join settlement_rollup
          on settlement_rollup.campaign_id =
            campaigns.id

        order by
          campaigns.created_at desc
      `,
    );

  return result.rows.map(
    (row) => {
      const starts =
        Number(
          row.checkout_starts,
        );

      const conversions =
        Number(
          row.conversions,
        );

      return {
        campaignId:
          row.campaign_id,
        campaignName:
          row.campaign_name,
        songTitle:
          row.song_title,
        views:
          Number(row.views),
        listeners:
          Number(
            row.listeners,
          ),
        audioCompletions:
          Number(
            row.audio_completions,
          ),
        supportClicks:
          Number(
            row.support_clicks,
          ),
        sponsorClicks:
          Number(
            row.sponsor_clicks,
          ),
        checkoutStarts:
          starts,
        paymentFailures:
          Number(
            row.payment_failures,
          ),
        conversions,
        revenueCents:
          Number(
            row.revenue_cents,
          ),
        conversionRate:
          starts > 0
            ? conversions /
              starts
            : 0,
      };
    },
  );
}
