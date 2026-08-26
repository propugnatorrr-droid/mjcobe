import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Globe, AtSign, ShoppingBag } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { AmountFigure } from '@/components/primitives/AmountFigure';
import { getSponsorProfile } from '@/lib/sponsor/queries';
import { text } from '@/lib/copy/site-copy';
import { setting } from '@/lib/config/settings';
import { cents } from '@/lib/money/cents';

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export default async function SponsorProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = await getSponsorProfile(slug);
  if (!profile) notFound();

  const [officialSupporterOf, contributedLabel, websiteLabel, instagramLabel, shopLabel] =
    await Promise.all([
      text('partner.official_supporter'),
      text('partner.contributed'),
      text('partner.website'),
      text('partner.instagram'),
      text('partner.shop'),
    ]);

  let sinceLabel: string | null = null;
  if (profile.supportedSince) {
    const locale = await setting('locale');
    const timeZone = await setting('displayTimeZone');
    const month = new Intl.DateTimeFormat(locale, { month: 'long', timeZone }).format(profile.supportedSince);
    const year = profile.supportedSince.getFullYear();
    sinceLabel = await text('partner.since', { month, year: String(year) });
  }

  return (
    <main className="surface-ink min-h-screen">
      <SiteNav />

      <section className="mx-auto max-w-3xl px-6 py-16 md:px-12 md:py-24">
        <div className="flex items-center gap-6">
          {profile.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.logoPath} alt="" width={64} height={64} className="h-16 w-auto" />
          ) : null}
          <h1 className="font-display text-display text-[var(--text)]">{profile.businessName}</h1>
        </div>

        {sinceLabel ? (
          <p className="mt-3 font-mono text-eyebrow uppercase text-[var(--champagne)]">{sinceLabel}</p>
        ) : null}

        {profile.songs.length > 0 ? (
          <div className="mt-8 flex flex-col gap-3">
            <Eyebrow>{officialSupporterOf}</Eyebrow>
            {profile.songs.map((song) => (
              <Link
                key={song.id}
                href={`/song/${song.slug}`}
                className="flex items-center justify-between rounded-[var(--radius-panel)] border p-5 transition-colors [transition-duration:var(--duration-signature)] hover:border-[var(--champagne)]"
                style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
              >
                <span className="font-display text-xl text-[var(--text)]">{song.title}</span>
                <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                  {contributedLabel} <AmountFigure cents={cents(song.contributedCents)} />
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        {profile.description ? (
          <p className="mt-8 max-w-[62ch] text-body text-[var(--text-dim)]">{profile.description}</p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-6">
          {profile.website ? (
            <Link
              href={profile.website}
              className="flex items-center gap-2 font-mono text-eyebrow uppercase text-[var(--text-dim)] hover:text-[var(--champagne)]"
            >
              <Globe aria-hidden size={16} />
              {websiteLabel}
            </Link>
          ) : null}
          {profile.instagram ? (
            <Link
              href={`https://instagram.com/${profile.instagram}`}
              className="flex items-center gap-2 font-mono text-eyebrow uppercase text-[var(--text-dim)] hover:text-[var(--champagne)]"
            >
              <AtSign aria-hidden size={16} />
              {instagramLabel}
            </Link>
          ) : null}
          {profile.shopUrl ? (
            <Link
              href={profile.shopUrl}
              className="flex items-center gap-2 font-mono text-eyebrow uppercase text-[var(--text-dim)] hover:text-[var(--champagne)]"
            >
              <ShoppingBag aria-hidden size={16} />
              {shopLabel}
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
