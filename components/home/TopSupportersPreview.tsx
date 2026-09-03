import { Heart } from 'lucide-react';
import { LeaderboardRow } from '@/components/primitives/LeaderboardRow';
import type { LeaderboardRowData } from '@/lib/campaign/queries';
import { cents } from '@/lib/money/cents';

type TopSupportersPreviewProps = {
  label: string;
  rows: LeaderboardRowData[];
  anonymousLabel: string;
  hiddenAmountLabel: string;
};

/**
 * Reuses the same ranked-row primitive the song page's full leaderboard
 * uses (medal icons, avatar, tabular amount) instead of a second
 * near-identical "top fan" card — see components/primitives/LeaderboardRow.tsx.
 * `row.slug` is already null for anonymous/unapproved supporters (computed
 * server-side in lib/campaign/queries.ts's standingsFor()), so linking
 * straight off it never exposes a profile that shouldn't be public.
 */
export function TopSupportersPreview({
  label,
  rows,
  anonymousLabel,
  hiddenAmountLabel,
}: TopSupportersPreviewProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="home-campaign-leader home-top-supporters">
      <div className="home-campaign-leader-heading">
        <Heart aria-hidden size={15} strokeWidth={1.8} />
        <p>{label}</p>
      </div>

      <div className="home-top-supporters-list">
        {rows.map((row) => (
          <LeaderboardRow
            key={row.id}
            rank={row.rank}
            name={row.isAnonymous ? anonymousLabel : row.name}
            amount={cents(row.amountCents)}
            hideAmount={row.hideAmount}
            hiddenLabel={hiddenAmountLabel}
            href={row.slug ? `/supporter/${row.slug}` : null}
            avatarUrl={row.logoPath}
          />
        ))}
      </div>
    </div>
  );
}
