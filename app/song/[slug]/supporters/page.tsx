import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { LeaderboardRow } from '@/components/primitives/LeaderboardRow';
import { getSongPage } from '@/lib/song/queries';
import { getLeaderboard } from '@/lib/campaign/queries';
import { text } from '@/lib/copy/site-copy';
import { cents } from '@/lib/money/cents';

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export default async function AllSupportersPage({ params }: Props) {
  const { slug } = await params;
  const data = await getSongPage(slug);
  if (!data?.campaign) notFound();

  const [{ rows }, heading, anonymous, hidden, empty] = await Promise.all([
    getLeaderboard(data.campaign.id, 'fan'),
    text('song.section.supporters'),
    text('song.anonymous'),
    text('song.amount_hidden'),
    text('song.empty.supporters'),
  ]);

  return (
    <main className="surface-ink min-h-screen">
      <SiteNav />

      <section className="mx-auto max-w-3xl px-6 py-16 md:px-12 md:py-24">
        <Eyebrow>{data.song.title}</Eyebrow>
        <h1 className="mt-4 font-display text-display text-[var(--text)]">{heading}</h1>

        <div
          className="mt-10 overflow-hidden rounded-[var(--radius-panel)] border"
          style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
        >
          {rows.length === 0 ? (
            <p className="max-w-[62ch] p-6 text-body text-[var(--text-dim)]">{empty}</p>
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
                  row.slug
                    ? `/supporter/${row.slug}`
                    : null
                }
              />
            ))
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
