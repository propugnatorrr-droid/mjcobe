import 'server-only';

import {
  desc,
  sql,
} from 'drizzle-orm';
import { db } from '@/lib/db/client';

export type ReferralLinkRow = {
  id: string;
  code: string;
  label: string | null;
  campaignLabel: string | null;
  visits: number;
  uniqueSessions: number;
  conversions: number;
  revenueCents: number;
  conversionRate: number;
  averageContributionCents:
    number;
  createdAt: Date;
};

type RawRow = {
  id: string;
  code: string;
  label: string | null;
  campaign_label:
    string | null;
  visits: number | string;
  unique_sessions:
    number | string;
  conversions:
    number | string;
  revenue_cents:
    number | string;
  average_contribution_cents:
    number | string;
  created_at: Date;
};

export async function listReferralLinks():
  Promise<ReferralLinkRow[]> {
  const result =
    await db.execute<RawRow>(
      sql`
        with visit_totals as (
          select
            referral_link_id,
            count(*)::int
              as visits,
            count(
              distinct session_id
            )::int
              as unique_sessions
          from referral_visits
          group by referral_link_id
        ),
        settled_totals as (
          select
            c.referral_link_id,
            count(
              distinct c.id
            ) filter (
              where balance.net_cents > 0
            )::int
              as conversions,
            coalesce(
              sum(
                greatest(
                  balance.net_cents,
                  0
                )
              ),
              0
            )::int
              as revenue_cents,
            coalesce(
              avg(
                greatest(
                  balance.net_cents,
                  0
                )
              ) filter (
                where balance.net_cents > 0
              ),
              0
            )::int
              as average_contribution_cents
          from contributions c
          join lateral (
            select
              coalesce(
                sum(le.amount_cents),
                0
              )::int as net_cents
            from ledger_entries le
            where
              le.contribution_id = c.id
          ) balance on true
          where
            c.referral_link_id
              is not null
            and c.is_test = false
          group by
            c.referral_link_id
        )
        select
          rl.id,
          rl.code,
          rl.label,
          campaigns.name
            as campaign_label,
          coalesce(
            vt.visits,
            0
          )::int as visits,
          coalesce(
            vt.unique_sessions,
            0
          )::int
            as unique_sessions,
          coalesce(
            st.conversions,
            0
          )::int
            as conversions,
          coalesce(
            st.revenue_cents,
            0
          )::int
            as revenue_cents,
          coalesce(
            st.average_contribution_cents,
            0
          )::int
            as average_contribution_cents,
          rl.created_at
        from referral_links rl
        left join campaigns
          on campaigns.id =
            rl.campaign_id
        left join visit_totals vt
          on vt.referral_link_id =
            rl.id
        left join settled_totals st
          on st.referral_link_id =
            rl.id
        order by
          rl.created_at desc
      `,
    );

  return result.rows.map(
    (row) => {
      const uniqueSessions =
        Number(
          row.unique_sessions,
        );

      const conversions =
        Number(
          row.conversions,
        );

      return {
        id: row.id,
        code: row.code,
        label: row.label,
        campaignLabel:
          row.campaign_label,
        visits:
          Number(row.visits),
        uniqueSessions,
        conversions,
        revenueCents:
          Number(
            row.revenue_cents,
          ),
        averageContributionCents:
          Number(
            row
              .average_contribution_cents,
          ),
        conversionRate:
          uniqueSessions > 0
            ? conversions /
              uniqueSessions
            : 0,
        createdAt:
          new Date(
            row.created_at,
          ),
      };
    },
  );
}
