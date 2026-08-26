import { Eyebrow } from '@/components/primitives/Eyebrow';
import { ButtonLink } from '@/components/primitives/Button';
import { AmountFigure } from '@/components/primitives/AmountFigure';
import { cents, formatCents } from '@/lib/money/cents';
import { costToTakeFirst } from '@/lib/ranking/engine';
import { text } from '@/lib/copy/site-copy';
import type { SongPageData } from '@/lib/song/queries';

/**
 * The competitive object. It states the current holder, the exact price of
 * displacing them, and nothing else — no urgency language, no persuasion.
 * The number is the argument.
 */
export async function CrownPanel({
  crown,
  songSlug,
  isAcceptingSupport,
}: {
  crown: NonNullable<SongPageData['crown']>;
  songSlug: string;
  isAcceptingSupport: boolean;
}) {
  const leader = crown.leader;

  // A visitor holds nothing, so their challenger balance is zero.
  const priceCents = leader
    ? costToTakeFirst({
        leaderCents: leader.amountCents,
        challengerCents: 0,
        incrementCents: crown.incrementCents,
      })
    : crown.floorCents;

  return (
    <section className="border-y border-[var(--line)] py-16 md:py-24">
      <Eyebrow>{await text('song.section.crown')}</Eyebrow>

      <p className="mt-8 max-w-[62ch] text-body text-[var(--text)]">
        {leader
          ? await text('song.crown.leader', {
              name: leader.isAnonymous
                ? await text('song.anonymous')
                : leader.name,
              amount: leader.hideAmount
                ? await text('song.amount_hidden')
                : formatCents(cents(leader.amountCents)),
            })
          : await text('song.crown.open')}
      </p>

      <div className="mt-12 flex flex-wrap items-end justify-between gap-8">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {await text('song.crown.cost')}
          </span>
          <span className="font-mono text-4xl text-[var(--text)] md:text-5xl">
            <AmountFigure cents={cents(priceCents)} />
          </span>
          <span className="font-mono text-eyebrow text-[var(--text-faint)]">
            {await text('song.crown.increment', {
              amount: formatCents(cents(crown.incrementCents)),
            })}
          </span>
        </div>

        {isAcceptingSupport ? (
          <ButtonLink href={`/song/${songSlug}/sponsor`} variant="primary">
            {await text('song.crown.cta')}
          </ButtonLink>
        ) : null}
      </div>
    </section>
  );
}
