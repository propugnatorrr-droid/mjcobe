import Link from 'next/link';
import { Medal } from 'lucide-react';
import { AmountFigure } from './AmountFigure';
import type { Cents } from '@/lib/money/cents';

const MEDAL_COLOR: Record<number, string> = {
  1: '#C9A227', // gold — the champagne hue
  2: '#B9C0C7', // silver
  3: '#B0754A', // bronze
};

function RankMark({ rank }: { rank: number }) {
  const medalColor = MEDAL_COLOR[rank];
  if (medalColor) {
    return <Medal aria-hidden size={20} color={medalColor} strokeWidth={2} />;
  }
  // Rank is content, not decoration, past the medal cutoff — text-dim, not
  // text-faint (which stays reserved for genuinely decorative marks).
  return (
    <span className="w-5 text-center font-mono text-eyebrow text-[var(--text-dim)]">
      {rank}
    </span>
  );
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- small avatar, not worth next/image's overhead
    return (
      <img
        src={avatarUrl}
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-full object-cover"
      />
    );
  }
  const initial = name.replace('@', '').charAt(0).toUpperCase() || '?';
  return (
    <span
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-ui text-sm font-medium text-[var(--text-dim)]"
      style={{ background: 'var(--ink-2)' }}
    >
      {initial}
    </span>
  );
}

export function LeaderboardRow({
  rank,
  name,
  amount,
  isTop = false,
  hideAmount = false,
  hiddenLabel,
  href,
  avatarUrl,
}: {
  rank: number;
  name: string;
  amount: Cents;
  isTop?: boolean;
  hideAmount?: boolean;
  /** Shown in place of the figure when the backer chose to hide it. */
  hiddenLabel?: string;
  href?: string | null;
  /** A real uploaded photo/logo. Falls back to an initial-letter monogram. */
  avatarUrl?: string | null;
}) {
  const label = (
    <span className="flex min-w-0 items-center gap-4">
      <RankMark rank={rank} />
      <Avatar name={name} avatarUrl={avatarUrl} />
      <span className="truncate text-[var(--text)]">{name}</span>
    </span>
  );

  return (
    <div
      className="flex h-16 items-center justify-between gap-6 border-b px-2"
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
        <span className="font-mono text-eyebrow whitespace-nowrap text-[var(--text-dim)]">
          {hiddenLabel}
        </span>
      ) : (
        <AmountFigure cents={amount} />
      )}
    </div>
  );
}
