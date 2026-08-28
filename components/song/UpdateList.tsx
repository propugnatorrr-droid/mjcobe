import {
  Eyebrow,
} from '@/components/primitives/Eyebrow';
import {
  Tag,
} from '@/components/primitives/Tag';
import {
  cents,
  formatCents,
} from '@/lib/money/cents';
import {
  text,
} from '@/lib/copy/site-copy';
import {
  formatDay,
} from '@/lib/song/queries';
import type {
  SongPageData,
} from '@/lib/song/queries';

type Props = {
  updates:
    SongPageData['updates'];
  unlockedAmountCents?: number;
};

export async function UpdateList({
  updates,
  unlockedAmountCents = 0,
}: Props) {
  return (
    <section className="py-16 md:py-24">
      <Eyebrow>
        {await text(
          'song.section.updates',
        )}
      </Eyebrow>

      {updates.length === 0 ? (
        <p className="mt-8 max-w-[62ch] text-body text-[var(--text-dim)]">
          {await text(
            'song.empty.updates',
          )}
        </p>
      ) : (
        <div className="mt-10 border-t border-[var(--line)]">
          {await Promise.all(
            updates.map(
              async (update) => {
                const gated =
                  update.minTierCents >
                  0;

                const locked =
                  gated &&
                  unlockedAmountCents <
                    update.minTierCents;

                return (
                  <article
                    key={update.id}
                    className="grid grid-cols-1 gap-4 border-b border-[var(--line)] py-10 md:grid-cols-[10rem_1fr] md:gap-12"
                  >
                    <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                      {update.publishedAt
                        ? await formatDay(
                            update.publishedAt,
                          )
                        : ''}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-4">
                        <h3 className="text-body uppercase tracking-[0.06em] text-[var(--text)]">
                          {update.title}
                        </h3>

                        {locked ? (
                          <Tag>
                            {await text(
                              'song.updates.locked_label',
                            )}
                          </Tag>
                        ) : null}

                        {gated &&
                        !locked ? (
                          <Tag>
                            {await text(
                              'song.updates.unlocked_label',
                            )}
                          </Tag>
                        ) : null}
                      </div>

                      <p className="mt-4 max-w-[62ch] whitespace-pre-line text-body text-[var(--text-dim)]">
                        {locked
                          ? await text(
                              'song.updates.locked',
                              {
                                amount:
                                  formatCents(
                                    cents(
                                      update.minTierCents,
                                    ),
                                  ),
                              },
                            )
                          : update.body}
                      </p>
                    </div>
                  </article>
                );
              },
            ),
          )}
        </div>
      )}
    </section>
  );
}
