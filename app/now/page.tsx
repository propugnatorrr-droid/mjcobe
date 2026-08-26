import Link from 'next/link';
import { PlayCircle, ExternalLink } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { ButtonLink } from '@/components/primitives/Button';
import { AmountFigure } from '@/components/primitives/AmountFigure';
import { NewsletterForm } from '@/components/now/NewsletterForm';
import { listCatalog } from '@/lib/catalog/queries';
import { getLeaderboard } from '@/lib/campaign/queries';
import { text } from '@/lib/copy/site-copy';
import { setting } from '@/lib/config/settings';
import { cents } from '@/lib/money/cents';

const SOCIAL_PLATFORMS = [
  { slug: 'instagram', settingKey: 'socialInstagramUrl', copyKey: 'now.social.instagram' },
  { slug: 'tiktok', settingKey: 'socialTiktokUrl', copyKey: 'now.social.tiktok' },
  { slug: 'youtube', settingKey: 'socialYoutubeUrl', copyKey: 'now.social.youtube' },
  { slug: 'x', settingKey: 'socialXUrl', copyKey: 'now.social.x' },
  { slug: 'spotify', settingKey: 'socialSpotifyUrl', copyKey: 'now.social.spotify' },
  { slug: 'apple-music', settingKey: 'socialAppleMusicUrl', copyKey: 'now.social.apple_music' },
] as const;

export const revalidate = 60;

export default async function NowPage() {
  const [catalog, title, newMusic, backNext, topSponsorLabel, latestVideo, watch,
    supportNow, joinInnerCircle, innerCircleSub, emailPlaceholder, join, privacyNote,
    subscribed, subscribeError] = await Promise.all([
    listCatalog(),
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
  ]);

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

        {featured ? (
          <div
            className="flex w-full flex-col items-center gap-4 rounded-[var(--radius-panel)] border p-6"
            style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
          >
            <Eyebrow>{newMusic}</Eyebrow>
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
            <p className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{topSponsorLabel}</p>
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
