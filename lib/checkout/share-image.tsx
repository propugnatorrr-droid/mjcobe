import 'server-only';

import {
  readFile,
} from 'node:fs/promises';
import path from 'node:path';
import {
  ImageResponse,
} from 'next/og';
import {
  getConfirmationData,
} from '@/lib/checkout/confirmation';
import {
  SHARE_FORMATS,
  type ShareFormat,
} from '@/lib/checkout/share-formats';
import {
  text,
} from '@/lib/copy/site-copy';
import {
  cents,
  formatCents,
} from '@/lib/money/cents';

async function loadMonoFont(): Promise<
  ArrayBuffer | null
> {
  try {
    const file = await readFile(
      path.join(
        process.cwd(),
        'app/fonts/martian-mono/MartianMono-Variable.ttf',
      ),
    );

    return Uint8Array.from(
      file,
    ).buffer;
  } catch {
    return null;
  }
}

export function shareImageNotFound() {
  return new Response('Not found', {
    status: 404,
    headers: {
      'Cache-Control':
        'private, no-store, max-age=0',
      'X-Robots-Tag':
        'noindex, nofollow, noarchive',
    },
  });
}

function paddedNumber(
  value: number,
): string {
  return String(value).padStart(
    4,
    '0',
  );
}

export async function createShareImage(
  token: string,
  formatKey: ShareFormat,
): Promise<Response> {
  const confirmation =
    await getConfirmationData(token);

  if (
    !confirmation ||
    !confirmation.settled
  ) {
    return shareImageNotFound();
  }

  const format =
    SHARE_FORMATS[formatKey];

  const isStory =
    formatKey === 'story';

  const isFeed =
    formatKey === 'feed';

  const isBusiness =
    confirmation.supportType ===
    'business';

  const displayedNumber =
    confirmation.foundingNumber ??
    confirmation.supporterNumber;

  const [
    artist,
    fanHeadline,
    partnerHeadline,
    foundingLabel,
    supporterLabel,
    privateAmount,
    amountHeading,
    storyLabel,
    feedLabel,
    xLabel,
  ] = await Promise.all([
    text('hero.artist_name'),
    text(
      'thanks.share.fan_headline',
    ),
    text(
      'thanks.share.partner_headline',
    ),
    text('thanks.founding_number'),
    text('thanks.supporter_number'),
    text('song.amount_hidden'),
    text('thanks.amount'),
    text('thanks.share.story'),
    text('thanks.share.feed'),
    text('thanks.share.x'),
  ]);

  const numberLabel =
    confirmation.foundingNumber
      ? foundingLabel
      : supporterLabel;

  const amountLabel =
    confirmation.hideAmount
      ? privateAmount
      : formatCents(
          cents(
            confirmation.netAmountCents,
          ),
        );

  const headline = isBusiness
    ? partnerHeadline
    : fanHeadline;

  const identity =
    isBusiness &&
    confirmation.businessName
      ? confirmation.businessName
      : artist;

  const formatLabel =
    formatKey === 'story'
      ? storyLabel
      : formatKey === 'feed'
        ? feedLabel
        : xLabel;

  const font = await loadMonoFont();

  const horizontalPadding =
    isStory ? 92 : 72;

  const titleSize =
    isStory
      ? 104
      : isFeed
        ? 82
        : 68;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent:
            'space-between',
          background: '#0a0a0b',
          color: '#edeae4',
          paddingTop:
            isStory ? 126 : 72,
          paddingBottom:
            isStory ? 112 : 66,
          paddingLeft:
            horizontalPadding,
          paddingRight:
            horizontalPadding,
          fontFamily: font
            ? 'Mono'
            : 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isStory ? 42 : 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize:
                isStory ? 26 : 22,
              letterSpacing:
                isStory ? 7 : 6,
              color: '#aaa69d',
              textTransform:
                'uppercase',
            }}
          >
            {headline}
          </div>

          <div
            style={{
              display: 'flex',
              maxWidth: '100%',
              fontSize: titleSize,
              lineHeight: 0.98,
              letterSpacing: -2,
              textTransform:
                'uppercase',
            }}
          >
            {confirmation.songTitle}
          </div>

          <div
            style={{
              display: 'flex',
              fontSize:
                isStory ? 38 : 28,
              letterSpacing:
                isStory ? 8 : 6,
              color: '#c9a86a',
              textTransform:
                'uppercase',
            }}
          >
            {identity}
          </div>

          {isBusiness &&
          confirmation.businessName ? (
            <div
              style={{
                display: 'flex',
                fontSize:
                  isStory ? 22 : 18,
                letterSpacing: 5,
                color: '#8f8b83',
                textTransform:
                  'uppercase',
              }}
            >
              {artist}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection:
              isStory
                ? 'column'
                : 'row',
            alignItems:
              isStory
                ? 'flex-start'
                : 'flex-end',
            justifyContent:
              'space-between',
            gap: isStory ? 54 : 32,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {!isBusiness &&
            displayedNumber ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection:
                    'column',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize:
                      isStory ? 21 : 17,
                    letterSpacing: 5,
                    color: '#aaa69d',
                    textTransform:
                      'uppercase',
                  }}
                >
                  {numberLabel}
                </div>

                <div
                  style={{
                    display: 'flex',
                    fontSize:
                      isStory ? 82 : 58,
                    color: '#c9a86a',
                    lineHeight: 1,
                  }}
                >
                  #
                  {paddedNumber(
                    displayedNumber,
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  fontSize:
                    isStory ? 31 : 24,
                  color: '#c9a86a',
                  letterSpacing: 5,
                  textTransform:
                    'uppercase',
                }}
              >
                {partnerHeadline}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems:
                isStory
                  ? 'flex-start'
                  : 'flex-end',
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize:
                  isStory ? 19 : 16,
                letterSpacing: 5,
                color: '#aaa69d',
                textTransform:
                  'uppercase',
              }}
            >
              {amountHeading}
            </div>

            <div
              style={{
                display: 'flex',
                fontSize:
                  isStory ? 64 : 44,
                color: '#edeae4',
              }}
            >
              {amountLabel}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: 4,
              background: '#9f2530',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              fontSize:
                isStory ? 18 : 15,
              letterSpacing: 4,
              color: '#77736d',
              textTransform:
                'uppercase',
            }}
          >
            <div
              style={{
                display: 'flex',
              }}
            >
              {artist}
            </div>

            <div
              style={{
                display: 'flex',
              }}
            >
              {formatLabel}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: format.width,
      height: format.height,
      fonts: font
        ? [
            {
              name: 'Mono',
              data: font,
              style: 'normal',
            },
          ]
        : undefined,
      headers: {
        'Cache-Control':
          'private, no-store, max-age=0',
        'X-Robots-Tag':
          'noindex, nofollow, noarchive',
        'Content-Disposition':
          `inline; filename="mjcobe-${confirmation.songSlug}-${format.filenameSuffix}.png"`,
      },
    },
  );
}
