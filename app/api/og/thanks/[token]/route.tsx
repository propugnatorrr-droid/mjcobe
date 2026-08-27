import {
  ImageResponse,
} from 'next/og';
import {
  readFile,
} from 'node:fs/promises';
import path from 'node:path';
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

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

async function monoFont(): Promise<
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

function noStore(
  body: BodyInit,
  status: number,
) {
  return new Response(body, {
    status,
    headers: {
      'Cache-Control':
        'private, no-store, max-age=0',
      'X-Robots-Tag':
        'noindex, nofollow, noarchive',
    },
  });
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      token: string;
    }>;
  },
) {
  const { token } = await params;
  const confirmation =
    await getConfirmationData(token);

  // Pending, declined and refunded submissions
  // must not receive a share graphic.
  if (
    !confirmation ||
    !confirmation.settled
  ) {
    return noStore(
      'Not found',
      404,
    );
  }

  const headline = await text(
    'thanks.og.line',
  );
  const artist = await text(
    'hero.artist_name',
  );
  const numberLabel =
    confirmation.foundingNumber
      ? await text(
          'thanks.founding_number',
        )
      : await text(
          'thanks.supporter_number',
        );

  const displayedNumber =
    confirmation.foundingNumber ??
    confirmation.supporterNumber;

  const amountLabel =
    confirmation.hideAmount
      ? await text(
          'song.amount_hidden',
        )
      : formatCents(
          cents(
            confirmation.amountCents,
          ),
        );

  const font = await monoFont();

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
          padding: 72,
          fontFamily: font
            ? 'Mono'
            : 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              color: '#8b8983',
            }}
          >
            {headline}
          </div>

          <div
            style={{
              fontSize: 84,
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            {confirmation.songTitle}
          </div>

          <div
            style={{
              fontSize: 26,
              letterSpacing: 8,
              color: '#8b8983',
            }}
          >
            {artist}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent:
              'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {displayedNumber ? (
              <>
                <div
                  style={{
                    fontSize: 18,
                    letterSpacing: 5,
                    color: '#56544f',
                  }}
                >
                  {numberLabel}
                </div>

                <div
                  style={{
                    fontSize: 56,
                    color: '#c9a227',
                  }}
                >
                  #
                  {String(
                    displayedNumber,
                  ).padStart(4, '0')}
                </div>
              </>
            ) : (
              <div
                style={{
                  fontSize: 26,
                  color: '#c9a227',
                  letterSpacing: 4,
                }}
              >
                OFFICIAL PARTNER
              </div>
            )}
          </div>

          <div
            style={{
              fontSize: 44,
            }}
          >
            {amountLabel}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            height: 3,
            background: '#8e1d22',
            width: '100%',
          }}
        />
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
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
          `inline; filename="mjcobe-${confirmation.songSlug}.png"`,
      },
    },
  );
}
