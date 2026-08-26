import { AmountFigure } from './AmountFigure';
import type { Cents } from '@/lib/money/cents';

export function LeaderboardRow({
  rank,
  name,
  amount,
  isTop = false,
}: {
  rank: number;
  name: string;
  amount: Cents;
  isTop?: boolean;
}) {
  return (
    <div
      className="flex h-14 items-center justify-between border-b md:h-16"
      style={{
        borderBottomColor: 'var(--line)',
        borderTopWidth: isTop ? '1px' : undefined,
        borderTopColor: isTop ? 'var(--champagne)' : undefined,
      }}
    >
      <span className="flex items-baseline gap-4">
        <span
          className="font-mono text-eyebrow"
          style={{ color: isTop ? 'var(--champagne)' : 'var(--text-dim)' }}
        >
          {String(rank).padStart(2, '0')}
        </span>
        <span className="text-[var(--text)]">{name}</span>
      </span>
      <AmountFigure cents={amount} />
    </div>
  );
}
