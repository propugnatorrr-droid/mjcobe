import type { LucideIcon } from 'lucide-react';
import type { LeaderboardRowData } from '@/lib/campaign/queries';
import { cents, formatCents } from '@/lib/money/cents';

type SpotlightRowProps = {
  label: string;
  row: LeaderboardRowData;
  anonymousLabel: string;
  hiddenAmountLabel: string;
  icon: LucideIcon;
  logo?: boolean;
};

function initialOf(name: string) {
  return name.replace('@', '').trim().charAt(0).toUpperCase() || '?';
}

export function SpotlightRow({
  label,
  row,
  anonymousLabel,
  hiddenAmountLabel,
  icon: Icon,
  logo = false,
}: SpotlightRowProps) {
  const name = row.isAnonymous ? anonymousLabel : row.name;
  const amount = row.hideAmount
    ? hiddenAmountLabel
    : formatCents(cents(row.amountCents));

  return (
    <article className="min-w-0">
      <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-[var(--champagne)]">
        {label}
      </p>

      <div className="mt-4 flex min-w-0 items-center gap-4">
        {row.logoPath ? (
          // This may be a supporter avatar or a sponsor logo. The sponsor
          // variant uses contain so transparent brand artwork is not cropped.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.logoPath}
            alt=""
            width={52}
            height={52}
            className={[
              'h-13 w-13 shrink-0 rounded-full',
              'border border-[rgba(201,162,39,0.48)]',
              'bg-[var(--ink)]',
              logo ? 'object-contain p-2.5' : 'object-cover',
            ].join(' ')}
          />
        ) : (
          <span
            aria-hidden
            className={[
              'flex h-13 w-13 shrink-0 items-center justify-center',
              'rounded-full border border-[rgba(201,162,39,0.48)]',
              'bg-[var(--ink)]',
              'font-serif text-lg text-[var(--champagne)]',
            ].join(' ')}
          >
            {initialOf(name)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-ui text-base font-medium text-[var(--text)]">
            {name}
          </p>

          <p className="mt-1 flex items-center gap-2 text-sm text-[var(--text-dim)]">
            <Icon
              aria-hidden
              size={14}
              strokeWidth={1.8}
              color="var(--champagne)"
            />
            <span className="numeric">{amount}</span>
          </p>
        </div>
      </div>
    </article>
  );
}
