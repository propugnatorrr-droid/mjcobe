import { config } from '@/lib/config/defaults';

/** Integer cents. Never a float. Format only at the render edge. */
export type Cents = number & { readonly __brand: 'Cents' };

export function cents(value: number): Cents {
  return value as Cents;
}

/**
 * Whole dollars when the amount has no cents remainder, otherwise two
 * decimal places — custom contribution amounts are not always round, and
 * dropping their cents would misreport the actual figure.
 *
 * `forceDecimals` lets CountUp lock the decimal-place count to its final
 * value's shape for every intermediate frame, so a counting figure never
 * changes width (and therefore never reflows its row) partway through the
 * animation because an in-between cents value happened to land differently
 * than the target.
 */
export function formatCents(value: Cents, opts?: { forceDecimals?: boolean }): string {
  const hasRemainder = opts?.forceDecimals ?? Math.abs(value) % 100 !== 0;
  return new Intl.NumberFormat(config('locale'), {
    style: 'currency',
    currency: config('currency'),
    minimumFractionDigits: hasRemainder ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
