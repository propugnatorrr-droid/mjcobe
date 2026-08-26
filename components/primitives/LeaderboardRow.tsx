import Link from 'next/link';
import { AmountFigure } from './AmountFigure';
import type { Cents } from '@/lib/money/cents';

export function LeaderboardRow({
  rank,
  name,
  amount,
  isTop = false,
  hideAmount = false,
  hiddenLabel,
  href,
}: {
  rank: number;
  name: string;
  amount: Cents;
  isTop?: boolean;
  hideAmount?: boolean;
  /** Shown in place of the figure when the backer chose to hide it. */
  hiddenLabel?: string;
  href?: string | null;
}) {
  const label = (
    <span className="flex min-w-0 items-baseline gap-4">
      <span
        className="font-mono text-eyebrow"
        style={{ color: isTop ? 'var(--champagne)' : 'var(--text-dim)' }}
      >
        {String(rank).padStart(2, '0')}
      </span>
      <span className="truncate text-[var(--text)]">{name}</span>
    </span>
  );

  return (
    <div
      className="flex h-14 items-center justify-between gap-6 border-b md:h-16"
      style={{
        borderBottomColor: 'var(--line)',
        borderTopWidth: isTop ? '1px' : undefined,
        borderTopColor: isTop ? 'var(--champagne)' : undefined,
      }}
    >
      {href ? (
        <Link
          href={href}
          className="min-w-0 transition-opacity [transition-duration:var(--duration-signature)] hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {label}
        </Link>
      ) : (
        label
      )}

      {hideAmount ? (
        <span className="font-mono text-eyebrow whitespace-nowrap text-[var(--text-faint)]">
          {hiddenLabel}
        </span>
      ) : (
        <AmountFigure cents={amount} />
      )}
    </div>
  );
}
