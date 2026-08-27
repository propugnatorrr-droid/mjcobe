import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SimulationRibbon } from '@/components/SimulationRibbon';
import { SiteNav } from '@/components/SiteNav';
import { SongHero } from '@/components/song/SongHero';
import { FundingPanel } from '@/components/song/FundingPanel';
import { CrownPanel } from '@/components/song/CrownPanel';
import { LeaderboardPanel } from '@/components/song/LeaderboardPanel';
import { TierGrid } from '@/components/song/TierGrid';
import { UpdateList } from '@/components/song/UpdateList';
import { JourneyList } from '@/components/song/JourneyList';
import { SupportBar } from '@/components/song/SupportBar';
import { Rule } from '@/components/primitives/Rule';
import { getSongPage } from '@/lib/song/queries';
import { text } from '@/lib/copy/site-copy';
import { cents, formatCents } from '@/lib/money/cents';

/** Money on this page must never be a minute stale. */
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSongPage(slug);
  if (!data) return { title: await text('notfound.title') };

  return {
    title: `${data.song.title} — ${await text('hero.artist_name')}`,
    description: data.song.description ?? (await text('hero.subcopy')),
  };
}

export default async function SongPage({ params }: Props) {
  const { slug } = await params;
  const data = await getSongPage(slug);
  if (!data) notFound();

  const { song, campaign, cover, audio, totals, fan, business, crown } = data;

  const supportEnabled = data.isAcceptingSupport && (campaign?.fanSupportEnabled ?? false);
  const sponsorEnabled =
    data.isAcceptingSupport && (campaign?.businessSponsorshipEnabled ?? false);

  return (
    <main className="surface-ink min-h-screen pb-40">
      <SimulationRibbon />
      <SiteNav />

      <div className="mx-auto max-w-5xl px-6 md:px-12">
        <SongHero song={song} campaign={campaign} cover={cover} audio={audio} />

        <FundingPanel
          totals={totals}
          daysLeft={data.daysLeft}
          isAcceptingSupport={data.isAcceptingSupport}
        />

        {/* The proof line. One sentence, stated once, never repeated. */}
        <p className="max-w-[62ch] text-body text-[var(--text)]">
          {totals.supporterCount > 0
            ? await text('song.proof_line', { count: totals.supporterCount })
            : await text('song.proof_line_empty')}
        </p>

        {!data.isAcceptingSupport ? (
          <p className="mt-6 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {await text('song.closed.notice')}
          </p>
        ) : null}

        <div className="mt-16">
          <Rule />
        </div>

        {crown && sponsorEnabled ? (
          <CrownPanel
            crown={crown}
            songSlug={song.slug}
            isAcceptingSupport={sponsorEnabled}
          />
        ) : null}

        <LeaderboardPanel
          headingKey="leaderboard.business_heading"
          emptyKey="song.empty.partners"
          moreKey="song.partners.more"
          rows={business.rows}
          totalCount={business.totalCount}
          linkPrefix="/partner"
          moreHref={`/song/${song.slug}/sponsors`}
        />

        <Rule />

        <LeaderboardPanel
          headingKey="song.section.supporters"
          emptyKey="song.empty.supporters"
          moreKey="leaderboard.more_supporters"
          rows={fan.rows}
          totalCount={fan.totalCount}
          moreHref={`/song/${song.slug}/supporters`}
        />

        <Rule />

        <TierGrid
          tiers={data.tiers}
          songSlug={song.slug}
          isAcceptingSupport={supportEnabled}
        />

        <UpdateList updates={data.updates} />

        <Rule />

        <JourneyList journey={data.journey} />
      </div>

      {data.isAcceptingSupport ? (
        <SupportBar
          primaryLabel={await text('button.back_this_song')}
          primaryHref={`/back?song=${song.slug}`}
          secondaryLabel={await text('button.sponsor_this_song')}
          secondaryHref={`/song/${song.slug}/sponsor`}
          figure={formatCents(cents(totals.meterCents))}
          caption={await text('song.proof_line', {
            count: totals.supporterCount,
          })}
        />
      ) : null}
    </main>
  );
}
