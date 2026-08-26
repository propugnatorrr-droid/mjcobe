import { formatCents, type Cents } from '@/lib/money/cents';

export function AmountFigure({ cents }: { cents: Cents }) {
  return <span className="font-mono">{formatCents(cents)}</span>;
}
