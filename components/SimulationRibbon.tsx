import { paymentsAreSimulated } from '@/lib/payments';
import { text } from '@/lib/copy/site-copy';

/**
 * Renders only when the active provider is not charging real cards. It is
 * deliberately loud: the worst outcome is a supporter believing they paid.
 */
export async function SimulationRibbon() {
  if (!paymentsAreSimulated()) return null;

  return (
    <aside
      role="status"
      className="w-full border-b border-[var(--line-strong)] px-6 py-2 md:px-12"
      style={{ background: 'var(--ember)', color: 'var(--surface-bg)' }}
    >
      <p className="mx-auto max-w-6xl font-mono text-eyebrow uppercase tracking-[0.14em]">
        {await text('simulation.ribbon')}
      </p>
    </aside>
  );
}
