import Link from 'next/link';
import { PlayCircle, ExternalLink, Flame, Trophy } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { ButtonLink } from '@/components/primitives/Button';
import { AmountFigure } from '@/components/primitives/AmountFigure';
import { AudioPreview } from '@/components/song/AudioPreview';
import { NewsletterForm } from '@/components/now/NewsletterForm';
import { listCatalog } from '@/lib/catalog/queries';
import { getLeaderboard } from '@/lib/campaign/queries';
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
  if (entry.isAnonymous) return text('now.activity.fan_anonymous', { song: entry.songTitle, amount });
  if (entry.hideAmount) return text('now.activity.fan_hidden', { name: entry.name, song: entry.songTitle });
  return text('now.activity.fan', { name: entry.name, song: entry.songTitle, amount });
}

export default async function NowPage() {
  const [catalog, activity, title, newMusic, backNext, topSponsorLabel, latestVideo, watch,
    supportNow, joinInnerCircle, innerCircleSub, emailPlaceholder, join, privacyNote,
    subscribed, subscribeError, happeningNow, previewComingSoon] = await Promise.all([
    listCatalog(),
    getRecentActivity(5),
    text('now.title'),
    text('now.new_music'),
    text('now.back_next'),
    text('now.top_sponsor'),
    text('now.latest_video'),
    text('now.watch'),
    text('now.support_now'),
    text('now.join_inner_circle'),
    text('now.inner_circle_sub'),
    text('now.email_placeholder'),
    text('now.join'),
    text('now.privacy_note'),
    text('now.subscribed'),
    text('now.subscribe_error'),
    text('now.happening_now'),
    text('song.preview_coming_soon'),
  ]);

  const newMusicSongs = catalog
    .filter((s) => s.status !== 'vault' && s.status !== 'draft')
    .slice(0, 3);

  const featured = catalog.find((s) => s.status === 'building')
    ?? catalog.find((s) => s.status === 'released')
    ?? null;

  const topSponsor = featured?.campaignId
    ? (await getLeaderboard(featured.campaignId, 'business', 1)).rows[0]
    : null;

  const videoSong = catalog.find((s) => s.status === 'released' || s.status === 'building') ?? null;

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
    <main className="surface-ink min-h-screen">
      <SiteNav />

      <section className="mx-auto flex max-w-lg flex-col items-center gap-10 px-6 py-16 text-center md:py-24">
        <h1 className="font-display text-display text-[var(--text)]">{title}</h1>

        {activity.length > 0 ? (
          <div
            className="flex w-full flex-col gap-3 rounded-[var(--radius-panel)] border p-6 text-left"
            style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
          >
            <span className="flex items-center gap-2 font-mono text-eyebrow uppercase text-[var(--champagne)]">
              <Flame aria-hidden size={14} />
              {happeningNow}
            </span>
            {await Promise.all(
              activity.map(async (entry) => (
                <div key={entry.id} className="flex items-baseline justify-between gap-4">
                  <p className="text-body text-[var(--text)]">{await activityLine(entry)}</p>
                  <span className="shrink-0 font-mono text-xs text-[var(--text-faint)]">
                    {formatRelativeTime(entry.occurredAt)}
                  </span>
                </div>
              )),
            )}
          </div>
        ) : null}

        {newMusicSongs.length > 0 ? (
          <div className="flex w-full flex-col gap-3 text-left">
            <Eyebrow>{newMusic}</Eyebrow>
            {await Promise.all(
              newMusicSongs.map(async (song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-4 rounded-[var(--radius-panel)] border p-3"
                  style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
                >
                  {song.coverPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={song.coverPath}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded-[var(--radius-panel)] object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-[var(--radius-panel)]" style={{ background: 'var(--ink)' }} />
                  )}
                  <Link href={`/song/${song.slug}`} className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg text-[var(--text)]">{song.title}</p>
                  </Link>
                  <div className="w-40 shrink-0">
                    <AudioPreview
                      src={song.audioPath}
                      previewStartMs={song.previewStartMs}
                      previewEndMs={song.previewEndMs}
                      comingSoonLabel={previewComingSoon}
                    />
                  </div>
                </div>
              )),
            )}
          </div>
        ) : null}

        {featured ? (
          <div
            className="flex w-full flex-col items-center gap-4 rounded-[var(--radius-panel)] border p-6"
            style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
          >
            <Eyebrow>{backNext}</Eyebrow>
            <h2 className="font-display text-2xl text-[var(--text)]">{featured.title}</h2>
            <ButtonLink href={`/song/${featured.slug}`} variant="primary" glow className="w-full">
              {featured.status === 'building' ? backNext : supportNow}
            </ButtonLink>
          </div>
        ) : null}

        {topSponsor ? (
          <div
            className="flex w-full flex-col items-center gap-2 rounded-[var(--radius-panel)] border p-6"
            style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
          >
            <span className="flex items-center gap-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              <Trophy aria-hidden size={14} color="var(--champagne)" />
              {topSponsorLabel}
            </span>
            <p className="flex items-baseline gap-3 text-body text-[var(--text)]">
              {topSponsor.isAnonymous ? await text('song.anonymous') : topSponsor.name}
              {!topSponsor.hideAmount ? (
                <AmountFigure cents={cents(topSponsor.amountCents)} />
              ) : null}
            </p>
          </div>
        ) : null}

        {videoSong?.youtubeUrl ? (
          <div
            className="flex w-full flex-col items-center gap-4 rounded-[var(--radius-panel)] border p-6"
            style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
          >
            <Eyebrow>{latestVideo}</Eyebrow>
            <ButtonLink href={videoSong.youtubeUrl} variant="ghost" className="w-full">
              <PlayCircle aria-hidden size={16} className="mr-2" />
              {watch}
            </ButtonLink>
          </div>
        ) : null}

        {socialLinks.length > 0 ? (
          <div className="flex w-full flex-col gap-2">
            {socialLinks.map((p) => (
              <Link
                key={p.slug}
                href={`/api/go/${p.slug}`}
                className="flex items-center justify-between rounded-[var(--radius-panel)] border px-5 py-3.5 font-ui text-sm uppercase tracking-[0.04em] text-[var(--text)] transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--champagne)]"
                style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
              >
                {p.label}
                <ExternalLink aria-hidden size={16} color="var(--text-dim)" />
              </Link>
            ))}
          </div>
        ) : null}

        <div className="w-full">
          <h2 className="font-display text-xl text-[var(--text)]">{joinInnerCircle}</h2>
          <p className="mt-2 text-body text-[var(--text-dim)]">{innerCircleSub}</p>
          <div className="mt-6">
            <NewsletterForm
              placeholder={emailPlaceholder}
              submitLabel={join}
              errorLabel={subscribeError}
              successLabel={subscribed}
            />
          </div>
          <p className="mt-4 font-mono text-eyebrow uppercase text-[var(--text-faint)]">
            {privacyNote}
          </p>
        </div>
      </section>
    </main>
  );
}
