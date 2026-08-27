import { Users } from 'lucide-react';
import type { CatalogSong } from '@/lib/catalog/queries';
import { cents, formatCents } from '@/lib/money/cents';

type CatalogCampaignStatsProps = {
  song: CatalogSong;
  supportersLabel: string;
};

export function CatalogCampaignStats({
  song,
  supportersLabel,
}: CatalogCampaignStatsProps) {
  const percent = Math.min(100, Math.max(0, song.percent));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-[var(--text-dim)]">
          <Users
            aria-hidden
            size={14}
            strokeWidth={1.8}
            color="var(--champagne)"
          />

          <span className="numeric font-medium text-[var(--text)]">
            {song.supporterCount.toLocaleString()}
          </span>

          <span className="uppercase tracking-[0.12em]">
            {supportersLabel}
          </span>
        </p>

        <span className="numeric text-xs font-semibold text-[var(--champagne)]">
          {percent}%
        </span>
      </div>

      <div>
        <div
          className="h-1.5 overflow-hidden rounded-full"
          style={{ background: 'var(--line)' }}
        >
          <div
            className="bg-gold h-full rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-1 text-xs text-[var(--text-dim)]">
          <span className="numeric font-medium text-[var(--champagne)]">
            {formatCents(cents(song.raisedCents))}
          </span>

          <span aria-hidden>/</span>

          <span className="numeric">
            {formatCents(cents(song.goalCents))}
          </span>
        </p>
      </div>
    </div>
  );
}
