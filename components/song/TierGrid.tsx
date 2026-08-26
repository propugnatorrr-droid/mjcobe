import { Check } from 'lucide-react';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { ButtonLink } from '@/components/primitives/Button';
import { AmountFigure } from '@/components/primitives/AmountFigure';
import { cents } from '@/lib/money/cents';
import { text } from '@/lib/copy/site-copy';
import type { SongPageData } from '@/lib/song/queries';

export async function TierGrid({
  tiers,
  songSlug,
  isAcceptingSupport,
}: {
  tiers: SongPageData['tiers'];
  songSlug: string;
  isAcceptingSupport: boolean;
}) {
  if (tiers.length === 0) return null;

  const selectLabel = await text('song.tiers.select');
  const soldOut = await text('song.tiers.sold_out');

  return (
    <section className="py-16 md:py-24">
      <Eyebrow>{await text('song.tiers.heading')}</Eyebrow>

      <div className="mt-10 flex flex-col gap-4">
        {tiers.map((tier) => {
          const exhausted =
            tier.quantityLimit !== null && tier.quantityLimit <= 0;

          return (
            <div
              key={tier.id}
              className="grid grid-cols-1 gap-6 rounded-[var(--radius-panel)] border p-6 md:grid-cols-[10rem_1fr_auto] md:items-start md:gap-12 md:p-8"
              style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
            >
              <span className="font-mono text-2xl text-[var(--text)]">
                <AmountFigure cents={cents(tier.amountCents)} />
              </span>

              <div className="min-w-0">
                <h3 className="text-body uppercase tracking-[0.06em] text-[var(--text)]">
                  {tier.name}
                </h3>
                {tier.description ? (
                  <p className="mt-3 max-w-[62ch] text-body text-[var(--text-dim)]">
                    {tier.description}
                  </p>
                ) : null}
                {tier.benefits.length > 0 ? (
                  <div className="mt-5 flex flex-col gap-2">
                    {tier.benefits.map((benefit) => (
                      <span
                        key={benefit}
                        className="flex items-center gap-2 text-body text-[var(--text-dim)]"
                      >
                        <Check aria-hidden size={16} color="var(--champagne)" strokeWidth={2.5} />
                        {benefit}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {isAcceptingSupport && !exhausted ? (
                <ButtonLink
                  href={`/back?song=${songSlug}&tier=${tier.id}`}
                  variant="ghost"
                >
                  {selectLabel}
                </ButtonLink>
              ) : (
                <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                  {exhausted ? soldOut : ''}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
