import {
  BarChart3,
  Check,
  Clock,
  Lock,
  type LucideIcon,
} from 'lucide-react';

type SongStatus =
  | 'draft'
  | 'building'
  | 'coming_soon'
  | 'released'
  | 'vault';

type StatusStyle = {
  foreground: string;
  background: string;
  border: string;
  Icon: LucideIcon;
};

const STYLES: Record<SongStatus, StatusStyle> = {
  released: {
    foreground: '#7fa47c',
    background: 'rgba(127, 164, 124, 0.1)',
    border: 'rgba(127, 164, 124, 0.34)',
    Icon: Check,
  },
  coming_soon: {
    foreground: '#d8b34a',
    background: 'rgba(216, 179, 74, 0.1)',
    border: 'rgba(216, 179, 74, 0.34)',
    Icon: Clock,
  },
  building: {
    foreground: '#7895b8',
    background: 'rgba(120, 149, 184, 0.1)',
    border: 'rgba(120, 149, 184, 0.34)',
    Icon: BarChart3,
  },
  vault: {
    foreground: '#8b8983',
    background: 'rgba(139, 137, 131, 0.09)',
    border: 'rgba(139, 137, 131, 0.3)',
    Icon: Lock,
  },
  draft: {
    foreground: '#8b8983',
    background: 'rgba(139, 137, 131, 0.09)',
    border: 'rgba(139, 137, 131, 0.3)',
    Icon: Lock,
  },
};

export function StatusBadge({
  status,
  label,
}: {
  status: SongStatus;
  label: string;
}) {
  const style = STYLES[status] ?? STYLES.draft;
  const { Icon } = style;

  return (
    <span
      className={[
        'inline-flex min-h-7 shrink-0 items-center gap-1.5',
        'rounded-full border px-2.5 py-1',
        'font-ui text-[0.625rem] font-semibold uppercase',
        'tracking-[0.12em]',
      ].join(' ')}
      style={{
        color: style.foreground,
        background: style.background,
        borderColor: style.border,
      }}
    >
      <Icon aria-hidden size={11} strokeWidth={2} />
      {label}
    </span>
  );
}
