import { paymentsAreSimulated } from '@/lib/payments';
import { text } from '@/lib/copy/site-copy';

/**
 * Non-negotiable honesty marker while PAYMENTS_PROVIDER is not `stripe`.
 * Rendered as a hairline strip, not a badge — it informs without decorating.
 */
export async function SimulationRibbon() {
  if (!paymentsAreSimulated()) return null;

  return (
    <div className="border-b border-[var(--line)] px-6 py-2 md:px-12">
      <span className="font-mono text-eyebrow uppercase text-[var(--champagne)]">
        {await text('simulation.ribbon')}
      </span>
    </div>
  );
}
