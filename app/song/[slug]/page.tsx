import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Crown } from 'lucide-react';
import { SimulationRibbon } from '@/components/SimulationRibbon';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { SongHero } from '@/components/song/SongHero';
import { FundingPanel } from '@/components/song/FundingPanel';
import { CrownPanel } from '@/components/song/CrownPanel';
import { LeaderboardPanel } from '@/components/song/LeaderboardPanel';
import { TierGrid } from '@/components/song/TierGrid';
import { UpdateList } from '@/components/song/UpdateList';
import { JourneyList } from '@/components/song/JourneyList';
import { SupportBar } from '@/components/song/SupportBar';
import { ButtonLink } from '@/components/primitives/Button';
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

  const [supportLabel, sponsorLabel, proofLine] = await Promise.all([
    text('button.back_this_song'),
    text('button.sponsor_this_song'),
    totals.supporterCount > 0
      ? text('song.proof_line', { count: totals.supporterCount })
      : text('song.proof_line_empty'),
  ]);

  return (
    <main className="surface-ink min-h-screen pb-32">
      <SimulationRibbon />
      <SiteNav sub="SONG JOURNEY" />

      <SongHero song={song} campaign={campaign} cover={cover} audio={audio} />

      <FundingPanel
        totals={totals}
        daysLeft={data.daysLeft}
        isAcceptingSupport={data.isAcceptingSupport}
        objective={campaign?.objective ?? null}
      />

      {/* Primary actions, kept side by side exactly as the mockups pair them. */}
      <div className="mx-auto max-w-[92rem] px-6 pt-10 md:px-10">
        {data.isAcceptingSupport ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ButtonLink
              href={`/back?song=${song.slug}`}
              variant="primary"
              glow
              className="!rounded-sm w-full !py-4"
            >
              {supportLabel}
            </ButtonLink>
            {sponsorEnabled ? (
              <ButtonLink
                href={`/song/${song.slug}/sponsor`}
                variant="ghost"
                className="!rounded-sm w-full !py-4"
              >
                {sponsorLabel}
              </ButtonLink>
            ) : null}
          </div>
        ) : (
          <p className="font-ui text-xs uppercase tracking-[0.2em] text-[var(--text-dim)]">
            {await text('song.closed.notice')}
          </p>
        )}
      </div>

      {/* Leaderboards side by side — fans left, partners right. */}
      <div className="mx-auto grid max-w-[92rem] grid-cols-1 gap-x-10 px-6 md:px-10 lg:grid-cols-2">
        <LeaderboardPanel
          headingKey="song.section.supporters"
          emptyKey="song.empty.supporters"
          moreKey="leaderboard.more_supporters"
          rows={fan.rows}
          totalCount={fan.totalCount}
          moreHref={`/song/${song.slug}/supporters`}
        />
        <LeaderboardPanel
          headingKey="leaderboard.business_heading"
          emptyKey="song.empty.partners"
          moreKey="song.partners.more"
          rows={business.rows}
          totalCount={business.totalCount}
          linkPrefix="/partner"
          moreHref={`/song/${song.slug}/sponsors`}
        />
      </div>

      {/* The proof line, set as the editorial pull-quote the mockups use. */}
      <section className="mx-auto max-w-[92rem] px-6 py-14 md:px-10">
        <div className="flex items-center gap-6">
          <span className="rule-gold h-px flex-1 opacity-40" />
          <p className="text-center font-serif text-[clamp(1.125rem,2.4vw,1.75rem)] italic text-[var(--text-dim)]">
            {proofLine}
          </p>
          <span className="rule-gold h-px flex-1 opacity-40" />
        </div>
        <Crown aria-hidden size={18} color="var(--champagne)" className="mx-auto mt-5" />
      </section>

      <div className="mx-auto max-w-[92rem] px-6 md:px-10">
        {crown && sponsorEnabled ? (
          <CrownPanel crown={crown} songSlug={song.slug} isAcceptingSupport={sponsorEnabled} />
        ) : null}

        <TierGrid tiers={data.tiers} songSlug={song.slug} isAcceptingSupport={supportEnabled} />

        <UpdateList updates={data.updates} />

        <JourneyList journey={data.journey} />
      </div>

      {data.isAcceptingSupport ? (
        <SupportBar
          primaryLabel={supportLabel}
          primaryHref={`/back?song=${song.slug}`}
          secondaryLabel={sponsorLabel}
          secondaryHref={`/song/${song.slug}/sponsor`}
          figure={formatCents(cents(totals.meterCents))}
          caption={proofLine}
        />
      ) : null}

      <SiteFooter />
    </main>
  );
}
