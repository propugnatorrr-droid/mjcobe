import Link from 'next/link';
import { PlayCircle, ChevronRight, Flame, Trophy, Star, Crown, Music2 } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileCta } from '@/components/MobileCta';
import { ButtonLink } from '@/components/primitives/Button';
import { LookbookImage } from '@/components/primitives/LookbookImage';
import { PhotoTreatment } from '@/components/treatments/PhotoTreatment';
import { NewsletterForm } from '@/components/now/NewsletterForm';
import { getLookbookImage } from '@/lib/lookbook/manifest';
import { getImageByPath } from '@/lib/media/queries';
import { listCatalog } from '@/lib/catalog/queries';
import { getLeaderboard } from '@/lib/campaign/queries';
import { resolveFeaturedCampaign } from '@/lib/home/queries';
import { getRecentActivity } from '@/lib/activity/queries';
import { formatRelativeTime } from '@/lib/song/queries';
import { text } from '@/lib/copy/site-copy';
import { setting } from '@/lib/config/settings';
import { cents, formatCents } from '@/lib/money/cents';

const SOCIAL_PLATFORMS = [
  { slug: 'instagram', settingKey: 'socialInstagramUrl', copyKey: 'now.social.instagram' },
  { slug: 'tiktok', settingKey: 'socialTiktokUrl', copyKey: 'now.social.tiktok' },
  { slug: 'youtube', settingKey: 'socialYoutubeUrl', copyKey: 'now.social.youtube' },
  { slug: 'x', settingKey: 'socialXUrl', copyKey: 'now.social.x' },
  { slug: 'spotify', settingKey: 'socialSpotifyUrl', copyKey: 'now.social.spotify' },
  { slug: 'apple-music', settingKey: 'socialAppleMusicUrl', copyKey: 'now.social.apple_music' },
] as const;

export const revalidate = 60;

async function activityLine(entry: Awaited<ReturnType<typeof getRecentActivity>>[number]) {
  const amount = formatCents(cents(entry.amountCents));
  if (entry.supportType === 'business') {
    return text('now.activity.business', { name: entry.name, song: entry.songTitle, amount });
  }
  if (entry.isAnonymous) {
    return text('now.activity.fan_anonymous', { song: entry.songTitle, amount });
  }
  if (entry.hideAmount) {
    return text('now.activity.fan_hidden', { name: entry.name, song: entry.songTitle });
  }
  return text('now.activity.fan', { name: entry.name, song: entry.songTitle, amount });
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="now-v4-panel rounded-[var(--radius-panel)] border p-5"
      style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
    >
      <p className="flex items-center gap-2 font-ui text-[0.625rem] uppercase tracking-[0.24em] text-[var(--champagne)]">
        {icon}
        {title}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function NowPage() {
  const [
    catalog, activity, artistName, rightNow, newMusic, backNext, topSponsorLabel,
    latestVideo, watch, supportNow, joinInnerCircle, innerCircleSub,
    emailPlaceholder, join, privacyNote, subscribed, subscribeError,
    happeningNow, listenLabel, fundedLabel,
  ] = await Promise.all([
    listCatalog(),
    getRecentActivity(4),
    text('hero.artist_name'), text('now.right_now'),
    text('now.new_music'), text('now.back_next'), text('now.top_sponsor'),
    text('now.latest_video'), text('now.watch'), text('now.support_now'),
    text('now.join_inner_circle'), text('now.inner_circle_sub'),
    text('now.email_placeholder'), text('now.join'), text('now.privacy_note'),
    text('now.subscribed'), text('now.subscribe_error'), text('now.happening_now'),
    text('home.listen'), text('home.funded'),
  ]);

  const hero = (await getImageByPath('/media/press-now-1792.jpg')) ?? getLookbookImage('hero');

  const newMusicSongs = catalog
    .filter((s) => s.status !== 'vault' && s.status !== 'draft')
    .slice(0, 3);

  // Same resolution the homepage uses for "the record to back right now"
  // — an explicit setting, falling back to the newest live campaign, never
  // a silent first-array-row read. A released song isn't "next to back,"
  // so unlike the old code this doesn't fall back to one.
  const featured = await resolveFeaturedCampaign(catalog);

  const topSponsor = featured?.campaignId
    ? (await getLeaderboard(featured.campaignId, 'business', 1)).rows[0]
    : null;

  const videoSong = catalog.find((s) => s.youtubeUrl) ?? null;

  const socialLinks = (
    await Promise.all(
      SOCIAL_PLATFORMS.map(async (p) => ({
        ...p,
        url: await setting(p.settingKey),
        label: await text(p.copyKey),
      })),
    )
  ).filter((p) => p.url);

  return (
    <main className="story-v4-page now-v4-page surface-ink min-h-screen">
      <SiteNav />

      {/* Hero */}
      <section className="now-v4-hero relative isolate min-h-[20rem] overflow-hidden md:min-h-[24rem]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-y-0 right-0 w-full md:w-[52%]">
            <PhotoTreatment vignette grain fill>
              <LookbookImage
                asset={hero}
                sizes="(min-width: 768px) 52vw, 100vw"
                priority
                className="absolute inset-0 h-full w-full object-cover"
                objectPosition="50% 35%"
              />
            </PhotoTreatment>
          </div>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, var(--ink) 0%, var(--ink) 30%, rgba(10,10,11,0.85) 46%, rgba(10,10,11,0.3) 64%, rgba(10,10,11,0.1) 100%)',
            }}
          />
        </div>

        <div className="mx-auto flex min-h-[20rem] max-w-[92rem] flex-col justify-center px-6 py-12 md:min-h-[24rem] md:px-10">
          <h1 className="font-display text-[clamp(2.25rem,6.5vw,5rem)] uppercase leading-[0.92] text-[var(--text)]">
            {artistName} /<br />
            <span className="text-gold">{rightNow}</span>
          </h1>
        </div>
      </section>

      <div className="now-v4-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="now-v4-column flex flex-col gap-6">
          {activity.length > 0 ? (
            <Panel title={happeningNow} icon={<Flame aria-hidden size={13} />}>
              <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--line)' }}>
                {await Promise.all(
                  activity.map(async (entry) => (
                    <li
                      key={entry.id}
                      className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <span className="text-body text-[var(--text)]">
                        {await activityLine(entry)}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-[var(--text-faint)]">
                        {formatRelativeTime(entry.occurredAt)}
                      </span>
                    </li>
                  )),
                )}
              </ul>
            </Panel>
          ) : null}

          {newMusicSongs.length > 0 ? (
            <Panel title={newMusic} icon={<Music2 aria-hidden size={13} />}>
              <ul className="flex flex-col gap-3">
                {newMusicSongs.map((song) => (
                  <li key={song.id} className="flex items-center gap-3">
                    {song.coverPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={song.coverPath}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded-sm object-cover"
                        style={{ background: 'var(--ink)' }}
                      />
                    ) : (
                      <div
                        className="h-12 w-12 shrink-0 rounded-sm"
                        style={{ background: 'var(--ink)' }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-ui text-sm text-[var(--text)]">{song.title}</p>
                      <p className="font-ui text-[0.625rem] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                        {artistName}
                      </p>
                    </div>
                    <Link
                      href={`/song/${song.slug}`}
                      className="flex shrink-0 items-center gap-1.5 rounded-sm border px-3 py-1.5 font-ui text-[0.625rem] uppercase tracking-[0.16em] text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--champagne)] hover:text-[var(--champagne)]"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <PlayCircle aria-hidden size={12} />
                      {listenLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {featured ? (
            <Panel title={backNext} icon={<Star aria-hidden size={13} />}>
              <p className="font-serif text-xl text-[var(--text)]">{featured.title}</p>
              <div className="mt-3 flex items-baseline justify-between gap-4">
                <p className="font-mono text-lg text-gold">
                  {formatCents(cents(featured.raisedCents))}
                </p>
                <p className="font-ui text-xs text-[var(--text-dim)]">
                  <span className="font-mono">{featured.percent}%</span> {fundedLabel}
                </p>
              </div>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full"
                style={{ background: 'var(--line)' }}
              >
                <div
                  className="bg-gold h-full rounded-full"
                  style={{ width: `${Math.min(100, featured.percent)}%` }}
                />
              </div>
              <ButtonLink
                href={`/song/${featured.slug}`}
                variant="primary"
                glow
                className="!rounded-sm mt-4 w-full"
              >
                {featured.status === 'building' ? backNext : supportNow}
              </ButtonLink>
            </Panel>
          ) : null}

          {topSponsor ? (
            <Panel title={topSponsorLabel} icon={<Trophy aria-hidden size={13} />}>
              <div className="flex items-center justify-between gap-4">
                <span className="font-display text-lg uppercase text-[var(--text)]">
                  {topSponsor.isAnonymous ? await text('song.anonymous') : topSponsor.name}
                </span>
                {!topSponsor.hideAmount ? (
                  <span className="font-mono text-lg text-gold">
                    {formatCents(cents(topSponsor.amountCents))}
                  </span>
                ) : null}
              </div>
            </Panel>
          ) : null}

          {videoSong?.youtubeUrl ? (
            <Panel title={latestVideo} icon={<PlayCircle aria-hidden size={13} />}>
              <div className="flex items-center justify-between gap-4">
                <span className="font-ui text-sm text-[var(--text)]">{videoSong.title}</span>
                <ButtonLink href={videoSong.youtubeUrl} variant="ghost" className="!rounded-sm !px-4 !py-2">
                  {watch}
                </ButtonLink>
              </div>
            </Panel>
          ) : null}
        </div>

        {/* Right column: the link rail */}
        <div className="now-v4-column flex flex-col gap-6">
          {socialLinks.length > 0 ? (
            <div className="now-v4-links flex flex-col gap-2.5">
              {socialLinks.map((p) => (
                <Link
                  key={p.slug}
                  href={`/api/go/${p.slug}`}
                  className="flex items-center justify-between rounded-[var(--radius-panel)] border px-5 py-4 transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--champagne)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
                >
                  <span className="font-display text-base uppercase tracking-[0.06em] text-[var(--text)]">
                    {p.label}
                  </span>
                  <ChevronRight aria-hidden size={16} color="var(--text-faint)" />
                </Link>
              ))}
            </div>
          ) : null}

          <Panel title={joinInnerCircle} icon={<Crown aria-hidden size={13} />}>
            <p className="text-body text-[var(--text-dim)]">{innerCircleSub}</p>
            <div className="mt-4">
              <NewsletterForm
                placeholder={emailPlaceholder}
                submitLabel={join}
                errorLabel={subscribeError}
                successLabel={subscribed}
              />
            </div>
            <p className="mt-3 font-ui text-[0.5625rem] uppercase tracking-[0.18em] text-[var(--text-faint)]">
              {privacyNote}
            </p>
          </Panel>
        </div>
      </div>
      <SiteFooter />
      <MobileCta />
    </main>
  );
}
