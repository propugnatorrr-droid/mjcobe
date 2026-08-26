import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Display } from '@/components/primitives/Display';
import { Rule } from '@/components/primitives/Rule';
import { FundingMeter } from '@/components/primitives/FundingMeter';
import { AmountFigure } from '@/components/primitives/AmountFigure';
import { CountUp } from '@/components/primitives/CountUp';
import { LeaderboardRow } from '@/components/primitives/LeaderboardRow';
import { Tag } from '@/components/primitives/Tag';
import { Button } from '@/components/primitives/Button';
import { RevealImage } from '@/components/primitives/RevealImage';
import { RevealText } from '@/components/primitives/RevealText';
import { copy } from '@/lib/copy/defaults';
import {
  gallerySong,
  gallerySongPercent,
  fanLeaderboard,
  fanLeaderboardMoreCount,
  businessLeaderboard,
} from '@/lib/fixtures/gallery';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-6 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
      {children}
    </h3>
  );
}

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-section-mobile md:px-12 md:py-section-desktop">
      {/* Proves the fixed, mix-blend-mode grain overlay doesn't trap this
          element's position: sticky — it should stay pinned while scrolling,
          which the persistent audio player later depends on. */}
      <div className="sticky top-0 z-10 mb-16 border-b border-[var(--line)] bg-[var(--ink)] py-3">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          sticky proof — this bar stays pinned under the grain overlay
        </span>
      </div>

      <section className="mb-24">
        <SectionLabel>RevealText + Display</SectionLabel>
        <RevealText
          lines={[copy('hero.artist_name'), copy('hero.tagline')]}
          className="font-display text-display text-[var(--text)]"
        />
        <p className="mt-6 max-w-[62ch] text-body text-[var(--text-dim)]">
          {copy('hero.subcopy')}
        </p>
      </section>

      <Rule />

      <section className="my-24">
        <SectionLabel>Eyebrow</SectionLabel>
        <div className="flex flex-wrap gap-8">
          <Eyebrow>{copy('eyebrow.currently_building')}</Eyebrow>
          <Eyebrow>{copy('eyebrow.top_business_sponsor')}</Eyebrow>
          <Eyebrow>{copy('eyebrow.live')}</Eyebrow>
        </div>
      </section>

      <Rule />

      <section className="my-24">
        <SectionLabel>Display</SectionLabel>
        <Display>{gallerySong.title}</Display>
      </section>

      <Rule />

      <section className="my-24">
        <SectionLabel>FundingMeter + CountUp + AmountFigure</SectionLabel>
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <span className="text-body text-[var(--text-dim)]">
            <CountUp cents={gallerySong.raised} /> raised of{' '}
            <AmountFigure cents={gallerySong.goal} /> goal
          </span>
          <span className="text-body text-[var(--text-dim)]">
            <CountUp value={gallerySong.supporterCount} /> supporters
          </span>
        </div>
        <FundingMeter percent={gallerySongPercent} />
      </section>

      <Rule />

      <section className="my-24">
        <SectionLabel>Tag</SectionLabel>
        <div className="flex flex-wrap gap-4">
          <Tag>{copy('tag.day_one')}</Tag>
          <Tag>{copy('tag.founding_supporter')}</Tag>
          <Tag>{copy('tag.presenting_partner')}</Tag>
        </div>
      </section>

      <Rule />

      <section className="my-24">
        <SectionLabel>Button — primary / ghost / disabled</SectionLabel>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">{copy('button.back_this_song')}</Button>
          <Button variant="ghost">{copy('button.sponsor_this_song')}</Button>
          <Button variant="primary" disabled>
            {copy('button.disabled_example')}
          </Button>
          <Button variant="ghost" disabled>
            {copy('button.disabled_example')}
          </Button>
        </div>
      </section>

      <Rule />

      <section className="my-24">
        <SectionLabel>LeaderboardRow — {copy('leaderboard.fan_heading')}</SectionLabel>
        <div>
          {fanLeaderboard.map((row) => (
            <LeaderboardRow
              key={row.rank}
              rank={row.rank}
              name={row.name}
              amount={row.amount}
              isTop={row.rank === 1}
            />
          ))}
        </div>
        <p className="mt-4 font-mono text-eyebrow text-[var(--text-dim)]">
          {copy('leaderboard.more_supporters').replace(
            '{count}',
            String(fanLeaderboardMoreCount),
          )}
        </p>
      </section>

      <Rule />

      <section className="my-24">
        <SectionLabel>RevealImage</SectionLabel>
        {/* No MJ photography exists in the repo yet — an honestly-labeled
            placeholder stands in, not a stock photo. */}
        <RevealImage>
          <div className="flex aspect-video w-full items-center justify-center bg-[var(--ink-2)]">
            <span className="font-mono text-eyebrow uppercase text-[var(--text-faint)]">
              {copy('revealimage.placeholder_label')}
            </span>
          </div>
        </RevealImage>
      </section>

      <Rule />

      <section className="surface-paper -mx-6 my-24 px-6 py-section-mobile md:-mx-12 md:px-12 md:py-section-desktop">
        <SectionLabel>Paper surface — mirrors /partners</SectionLabel>
        <div className="mb-12">
          {businessLeaderboard.map((row) => (
            <LeaderboardRow
              key={row.rank}
              rank={row.rank}
              name={row.name}
              amount={row.amount}
              isTop={row.rank === 1}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <Tag>{copy('tag.presenting_partner')}</Tag>
          <Button variant="primary">{copy('button.sponsor_this_song')}</Button>
          <Button variant="ghost">{copy('button.sponsor_this_song')}</Button>
        </div>
      </section>
    </div>
  );
}
