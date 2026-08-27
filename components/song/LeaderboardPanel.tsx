import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { LeaderboardRow } from '@/components/primitives/LeaderboardRow';
import { cents } from '@/lib/money/cents';
import { text } from '@/lib/copy/site-copy';
import type { CopyKey } from '@/lib/copy/defaults';
import type { LeaderboardRowData } from '@/lib/campaign/queries';

type LeaderboardPanelProps = {
  headingKey: CopyKey;
  emptyKey: CopyKey;
  moreKey: CopyKey;
  rows: LeaderboardRowData[];
  totalCount: number;
  linkPrefix?: string;
  moreHref?: string;
};

export async function LeaderboardPanel({
  headingKey,
  emptyKey,
  moreKey,
  rows,
  totalCount,
  linkPrefix,
  moreHref,
}: LeaderboardPanelProps) {
  const [
    heading,
    empty,
    anonymous,
    hidden,
  ] = await Promise.all([
    text(headingKey),
    text(emptyKey),
    text('song.anonymous'),
    text('song.amount_hidden'),
  ]);

  const remaining = Math.max(0, totalCount - rows.length);

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="flex items-center justify-between gap-5">
        <Eyebrow>{heading}</Eyebrow>

        <span
          aria-hidden
          className="rule-gold h-px min-w-8 flex-1 opacity-40"
        />
      </div>

      <div
        className={[
          'mt-7 overflow-hidden rounded-[var(--radius-panel)]',
          'border border-[var(--line)] bg-[var(--ink-2)]',
          'shadow-[var(--shadow-panel)]',
        ].join(' ')}
      >
        {rows.length === 0 ? (
          <p className="max-w-[62ch] p-6 text-base leading-7 text-[var(--text-dim)] sm:p-8">
            {empty}
          </p>
        ) : (
          rows.map((row) => (
            <LeaderboardRow
              key={row.id}
              rank={row.rank}
              name={row.isAnonymous ? anonymous : row.name}
              amount={cents(row.amountCents)}
              isTop={row.rank === 1}
              hideAmount={row.hideAmount}
              hiddenLabel={hidden}
              href={
                linkPrefix && row.slug
                  ? `${linkPrefix}/${row.slug}`
                  : null
              }
              avatarUrl={row.logoPath}
            />
          ))
        )}
      </div>

      {remaining > 0 ? (
        moreHref ? (
          <Link
            href={moreHref}
            className={[
              'mt-5 inline-flex items-center gap-2',
              'font-ui text-[0.6875rem] font-semibold uppercase',
              'tracking-[0.14em] text-[var(--text-dim)]',
              'transition-colors',
              '[transition-duration:var(--duration-signature)]',
              'hover:text-[var(--champagne)]',
            ].join(' ')}
          >
            {await text(moreKey, { count: remaining })}
            <ArrowRight aria-hidden size={14} />
          </Link>
        ) : (
          <p className="mt-5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
            {await text(moreKey, { count: remaining })}
          </p>
        )
      ) : null}
    </section>
  );
}
