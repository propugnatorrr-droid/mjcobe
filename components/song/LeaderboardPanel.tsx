import { Eyebrow } from '@/components/primitives/Eyebrow';
import { LeaderboardRow } from '@/components/primitives/LeaderboardRow';
import { cents } from '@/lib/money/cents';
import { text } from '@/lib/copy/site-copy';
import type { CopyKey } from '@/lib/copy/defaults';
import type { LeaderboardRowData } from '@/lib/campaign/queries';

export async function LeaderboardPanel({
  headingKey,
  emptyKey,
  moreKey,
  rows,
  totalCount,
  linkPrefix,
}: {
  headingKey: CopyKey;
  emptyKey: CopyKey;
  moreKey: CopyKey;
  rows: LeaderboardRowData[];
  totalCount: number;
  /** Present for sponsors, absent for fans until profiles ship. */
  linkPrefix?: string;
}) {
  const anonymous = await text('song.anonymous');
  const hidden = await text('song.amount_hidden');
  const remaining = Math.max(0, totalCount - rows.length);

  return (
    <section className="py-16 md:py-24">
      <Eyebrow>{await text(headingKey)}</Eyebrow>

      <div className="mt-8">
        {rows.length === 0 ? (
          <p className="max-w-[62ch] text-body text-[var(--text-dim)]">
            {await text(emptyKey)}
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
              href={linkPrefix && row.slug ? `${linkPrefix}/${row.slug}` : null}
            />
          ))
        )}
      </div>

      {remaining > 0 ? (
        <p className="mt-6 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {await text(moreKey, { count: remaining })}
        </p>
      ) : null}
    </section>
  );
}
