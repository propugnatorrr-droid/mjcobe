'use client';

import { formatCents, type Cents } from '@/lib/money/cents';
import { config } from '@/lib/config/defaults';
import { useCountUp } from '@/lib/motion/useCountUp';

type CountUpProps = { cents: Cents } | { value: number };

/**
 * Money and plain-integer counters (486 supporters, $18,420 raised) share
 * one animation core and one formatter per kind, so a counting figure never
 * renders differently from its static twin as the animation lands.
 */
export function CountUp(props: CountUpProps) {
  const target = 'cents' in props ? props.cents : props.value;
  const { ref, value } = useCountUp(target);

  const format = (amount: number) =>
    'cents' in props
      ? formatCents(amount as Cents, {
          forceDecimals: Math.abs(props.cents) % 100 !== 0,
        })
      : new Intl.NumberFormat(config('locale')).format(amount);

  const finalText = format(target);

  return (
    <span
      ref={ref}
      className="font-mono inline-block text-right"
      style={{ minWidth: `${finalText.length}ch` }}
    >
      {format(value)}
    </span>
  );
}
