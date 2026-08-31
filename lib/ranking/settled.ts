import 'server-only';

import {
  sql,
} from 'drizzle-orm';
import { db } from '@/lib/db/client';

export type SettledLeaderboardRow = {
  identityId: string;
  label: string;
  amountCents: number;
  firstSupportedAt: Date;
  hideAmount: boolean;
  isAnonymous: boolean;
};

export async function settledLeaderboard(
  input: {
    campaignId: string;
    supportType:
      | 'fan'
      | 'business';
    limit?: number;
  },
): Promise<
  SettledLeaderboardRow[]
> {
  const limit =
    Math.max(
      1,
      Math.min(
        input.limit ?? 100,
        500,
      ),
    );

  const result =
    await db.execute<{
      identity_id: string;
      label: string;
      amount_cents:
        number | string;
      first_supported_at: Date;
      hide_amount: boolean;
      is_anonymous: boolean;
    }>(
      sql`
        with balances as (
          select
            c.id,
            c.supporter_id,
            c.sponsor_id,
            c.display_name_snapshot,
            c.is_anonymous,
            c.hide_amount,
            c.created_at,
            coalesce(
              sum(le.amount_cents),
              0
            )::int as net_cents
          from contributions c
          left join ledger_entries le
            on le.contribution_id =
              c.id
          where
            c.campaign_id =
              ${input.campaignId}
            and c.support_type =
              ${input.supportType}
            and c.is_test = false
            and c.leaderboard_visible =
              true
            and c.moderation =
              'approved'
          group by c.id
        )
        select
          case
            when ${input.supportType} =
              'fan'
            then balances.supporter_id
            else balances.sponsor_id
          end::text
            as identity_id,
          case
            when ${input.supportType} =
              'fan'
            then case
              when bool_or(
                balances.is_anonymous
              )
              then 'Anonymous supporter'
              else coalesce(
                max(
                  balances
                    .display_name_snapshot
                ),
                'Supporter'
              )
            end
            else coalesce(
              max(
                sponsors.business_name
              ),
              'Partner'
            )
          end as label,
          sum(
            balances.net_cents
          )::int as amount_cents,
          min(
            balances.created_at
          ) as first_supported_at,
          bool_or(
            balances.hide_amount
          ) as hide_amount,
          bool_or(
            balances.is_anonymous
          ) as is_anonymous
        from balances
        left join sponsors
          on sponsors.id =
            balances.sponsor_id
        where
          balances.net_cents > 0
          and (
            ${input.supportType} =
              'fan'
            or sponsors.moderation =
              'approved'
          )
        group by
          case
            when ${input.supportType} =
              'fan'
            then balances.supporter_id
            else balances.sponsor_id
          end
        having
          sum(
            balances.net_cents
          ) > 0
        order by
          amount_cents desc,
          first_supported_at asc,
          identity_id asc
        limit ${limit}
      `,
    );

  return result.rows.map(
    (row) => ({
      identityId:
        row.identity_id,
      label: row.label,
      amountCents:
        Number(
          row.amount_cents,
        ),
      firstSupportedAt:
        new Date(
          row.first_supported_at,
        ),
      hideAmount:
        Boolean(
          row.hide_amount,
        ),
      isAnonymous:
        Boolean(
          row.is_anonymous,
        ),
    }),
  );
}

export async function settledCampaignTotal(
  campaignId: string,
): Promise<number> {
  const result =
    await db.execute<{
      total: number | string;
    }>(
      sql`
        select
          coalesce(
            sum(le.amount_cents),
            0
          )::int as total
        from ledger_entries le
        join contributions c
          on c.id =
            le.contribution_id
        where
          le.campaign_id =
            ${campaignId}
          and c.is_test = false
      `,
    );

  return Number(
    result.rows[0]?.total ??
      0,
  );
}
