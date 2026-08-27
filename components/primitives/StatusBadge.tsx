import { Check, Clock, BarChart3, Lock } from 'lucide-react';

type SongStatus = 'draft' | 'building' | 'coming_soon' | 'released' | 'vault';

/** The pill the mockups put under every song title. Colour carries meaning:
 * green = out in the world, gold = in progress, blue = actively building. */
const STYLES: Record<SongStatus, { fg: string; bg: string; border: string; Icon: typeof Check }> = {
  released:    { fg: '#5fd08a', bg: 'rgba(95, 208, 138, 0.12)', border: 'rgba(95, 208, 138, 0.35)', Icon: Check },
  coming_soon: { fg: '#d8b34a', bg: 'rgba(216, 179, 74, 0.12)', border: 'rgba(216, 179, 74, 0.35)', Icon: Clock },
  building:    { fg: '#6ba8f5', bg: 'rgba(107, 168, 245, 0.12)', border: 'rgba(107, 168, 245, 0.35)', Icon: BarChart3 },
  vault:       { fg: '#8b8983', bg: 'rgba(139, 137, 131, 0.12)', border: 'rgba(139, 137, 131, 0.35)', Icon: Lock },
  draft:       { fg: '#8b8983', bg: 'rgba(139, 137, 131, 0.12)', border: 'rgba(139, 137, 131, 0.35)', Icon: Lock },
};

export function StatusBadge({ status, label }: { status: SongStatus; label: string }) {
  const s = STYLES[status] ?? STYLES.draft;
  const { Icon } = s;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-ui text-xs"
      style={{ color: s.fg, background: s.bg, borderColor: s.border }}
    >
      <Icon aria-hidden size={12} />
      {label}
    </span>
  );
}
