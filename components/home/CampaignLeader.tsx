import type { LucideIcon } from 'lucide-react';
import type { LeaderboardRowData } from '@/lib/campaign/queries';
import { cents, formatCents } from '@/lib/money/cents';

type CampaignLeaderProps = {
  label: string;
  row: LeaderboardRowData;
  anonymousLabel: string;
  hiddenAmountLabel: string;
  icon: LucideIcon;
  featured?: boolean;
  logo?: boolean;
};

function initialOf(name: string) {
  return name
    .replace('@', '')
    .trim()
    .charAt(0)
    .toUpperCase() || '?';
}

export function CampaignLeader({
  label,
  row,
  anonymousLabel,
  hiddenAmountLabel,
  icon: Icon,
  featured = false,
  logo = false,
}: CampaignLeaderProps) {
  const name = row.isAnonymous
    ? anonymousLabel
    : row.name;

  const amount = row.hideAmount
    ? hiddenAmountLabel
    : formatCents(cents(row.amountCents));

  return (
    <article
      className={[
        'home-campaign-leader',
        featured ? 'home-campaign-leader-featured' : '',
      ].join(' ')}
    >
      <div className="home-campaign-leader-heading">
        <Icon
          aria-hidden
          size={15}
          strokeWidth={1.8}
        />

        <p>{label}</p>
      </div>

      <div className="home-campaign-leader-body">
        {row.logoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.logoPath}
            alt=""
            width={48}
            height={48}
            className={[
              'home-campaign-leader-avatar',
              logo ? 'object-contain p-2' : 'object-cover',
            ].join(' ')}
          />
        ) : (
          <span
            aria-hidden
            className="home-campaign-leader-avatar home-campaign-leader-initial"
          >
            {initialOf(name)}
          </span>
        )}

        <div className="min-w-0">
          <p className="home-campaign-leader-name">
            {name}
          </p>

          <p className="home-campaign-leader-amount">
            {amount}
          </p>
        </div>
      </div>
    </article>
  );
}
