import type {
  Metadata,
} from 'next';
import { notFound } from 'next/navigation';
import {
  SimulationRibbon,
} from '@/components/SimulationRibbon';
import {
  SiteNav,
} from '@/components/SiteNav';
import {
  SiteFooter,
} from '@/components/SiteFooter';
import {
  Eyebrow,
} from '@/components/primitives/Eyebrow';
import {
  Display,
} from '@/components/primitives/Display';
import {
  ButtonLink,
} from '@/components/primitives/Button';
import {
  ShareRow,
} from '@/components/checkout/ShareRow';
import {
  getConfirmationData,
} from '@/lib/checkout/confirmation';
import {
  text,
} from '@/lib/copy/site-copy';
import {
  cents,
  formatCents,
} from '@/lib/money/cents';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  referrer: 'no-referrer',
};

type Props = {
  params: Promise<{
    token: string;
  }>;
};

function paddedNumber(
  number: number,
): string {
  return String(number).padStart(
    4,
    '0',
  );
}

export default async function ThanksPage({
  params,
}: Props) {
  const { token } = await params;
  const confirmation =
    await getConfirmationData(token);

  if (!confirmation) {
    notFound();
  }

  if (!confirmation.settled) {
    if (
      confirmation.supportType !==
      'business'
    ) {
      notFound();
    }

    return (
      <main className="surface-ink min-h-screen">
        <SimulationRibbon />
        <SiteNav />

        <div className="mx-auto w-full max-w-5xl px-6 pt-16 md:px-12 md:pt-24">
          <Eyebrow>
            {await text(
              'checkout.business.heading',
            )}
          </Eyebrow>

          <div className="mt-8">
            <Display>
              {await text(
                'thanks.pending.heading',
              )}
            </Display>
          </div>

          <p className="mt-8 max-w-[62ch] text-body text-[var(--text-dim)]">
            {await text(
              'thanks.pending.body',
            )}
          </p>

          <div className="mt-12">
            <ButtonLink
              href={`/song/${confirmation.songSlug}`}
              variant="ghost"
            >
              {await text(
                'thanks.view_song',
              )}
            </ButtonLink>
          </div>
        </div>

        <SiteFooter />
      </main>
    );
  }

  const isBusiness =
    confirmation.supportType ===
    'business';

  const displayedNumber =
    confirmation.foundingNumber ??
    confirmation.supporterNumber;

  const displayedAmount =
    confirmation.hideAmount
      ? await text(
          'song.amount_hidden',
        )
      : formatCents(
          cents(
            confirmation.netAmountCents,
          ),
        );

  const shareLabels = {
    heading: await text(
      'thanks.share',
    ),
    story: await text(
      'thanks.share.story',
    ),
    feed: await text(
      'thanks.share.feed',
    ),
    x: await text(
      'thanks.share.x',
    ),
    share: await text(
      'thanks.share.action',
    ),
    sharing: await text(
      'thanks.share.sharing',
    ),
    download: await text(
      'thanks.download',
    ),
    copy: await text(
      'thanks.copy_link',
    ),
    copied: await text(
      'thanks.copied',
    ),
    previewAlt: await text(
      'thanks.share.preview_alt',
    ),
    shareTitle: await text(
      'thanks.share.title',
    ),
    shareText: await text(
      'thanks.share.text',
      {
        song:
          confirmation.songTitle,
      },
    ),
  };

  return (

    <main className="surface-ink min-h-screen pb-24">
      <SimulationRibbon />

      <SiteNav sub="SONG JOURNEY" />

      <div className="mx-auto max-w-3xl px-6 py-14 text-center md:py-20">
        <h1 className="font-display text-[clamp(2.25rem,6vw,4.5rem)] uppercase leading-[0.95] text-[var(--text)]">
          {await text(
            'thanks.heading',
          )}
        </h1>

        <p className="mt-5 text-body text-[var(--text-dim)]">
          {isBusiness &&
          confirmation.businessName
            ? await text(
                'thanks.subhead_business',
                {
                  business:
                    confirmation.businessName,
                  song:
                    confirmation.songTitle,
                },
              )
            : await text(
                'thanks.subhead',
                {
                  song:
                    confirmation.songTitle,
                },
              )}
        </p>

        {displayedNumber ? (
          <div className="mt-10">
            <p className="font-display text-[clamp(3.5rem,14vw,9rem)] leading-none text-gold">
              #
              {paddedNumber(
                displayedNumber,
              )}
            </p>

            <div className="mt-4 flex items-center justify-center gap-5">
              <span className="rule-gold h-px w-16 opacity-70" />

              <span className="font-ui text-[0.625rem] uppercase tracking-[0.28em] text-[var(--text-dim)]">
                {confirmation.foundingNumber
                  ? await text(
                      'thanks.founding_number',
                    )
                  : await text(
                      'thanks.supporter_number',
                    )}
              </span>

              <span className="rule-gold h-px w-16 opacity-70" />
            </div>
          </div>
        ) : null}

        {confirmation.rank ? (
          <div className="mt-9">
            <p className="font-ui text-[0.625rem] uppercase tracking-[0.28em] text-[var(--champagne)]">
              {await text(
                'thanks.rank',
              )}
            </p>

            <p className="mt-2 font-display text-[clamp(2rem,5vw,3rem)] leading-none text-[var(--text)]">
              #{confirmation.rank}
            </p>
          </div>
        ) : null}

        <p className="mt-8 font-ui text-xs uppercase tracking-[0.2em] text-[var(--text-dim)]">
          {await text(
            'thanks.amount',
          )}{' '}

          <span className="font-mono text-[var(--champagne)]">
            {displayedAmount}
          </span>
        </p>

        <div className="mt-12">
          <ShareRow
            token={token}
            shareUrlPath={`/s/${token}`}
            labels={shareLabels}
          />

        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink
            href={`/song/${confirmation.songSlug}`}
            variant="primary"
            glow
            className="!rounded-sm"
          >
            {await text(
              'thanks.view_song',
            )}
          </ButtonLink>

          <ButtonLink
            href="/back"
            variant="ghost"
            className="!rounded-sm"
          >
            {await text(
              'thanks.back_another',
            )}
          </ButtonLink>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
