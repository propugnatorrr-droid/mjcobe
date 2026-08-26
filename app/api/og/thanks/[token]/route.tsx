import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { resolveThanksToken } from '@/lib/checkout/tokens';
import { text } from '@/lib/copy/site-copy';
import { cents, formatCents } from '@/lib/money/cents';

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

/** Satori cannot parse woff2, so the OG card uses the TTF mono face only. */
async function monoFont(): Promise<ArrayBuffer | null> {
  try {
    const file = await readFile(
      path.join(process.cwd(), 'app/fonts/martian-mono/MartianMono-Variable.ttf'),
    );
    return Uint8Array.from(file).buffer;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const link = await resolveThanksToken(token);
  if (!link?.contributionId) return new Response('Not found', { status: 404 });

  const [contribution] = await db
    .select()
    .from(s.contributions)
    .where(eq(s.contributions.id, link.contributionId))
    .limit(1);
  if (!contribution) return new Response('Not found', { status: 404 });

  const [song] = await db
    .select({ title: s.songs.title })
    .from(s.songs)
    .where(eq(s.songs.id, contribution.songId))
    .limit(1);

  const [number] = await db
    .select({ number: s.supporterNumbers.number })
    .from(s.supporterNumbers)
    .where(eq(s.supporterNumbers.contributionId, contribution.id))
    .limit(1);

  const headline = await text('thanks.og.line');
  const artist = await text('hero.artist_name');
  const numberLabel = await text('thanks.supporter_number');
  const font = await monoFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0a0a0b',
          color: '#edeae4',
          padding: 72,
          fontFamily: font ? 'Mono' : 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: '#8b8983' }}>{headline}</div>
          <div style={{ fontSize: 84, lineHeight: 1, letterSpacing: -2 }}>
            {song?.title ?? ''}
          </div>
          <div style={{ fontSize: 26, letterSpacing: 8, color: '#8b8983' }}>{artist}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 18, letterSpacing: 5, color: '#56544f' }}>{numberLabel}</div>
            <div style={{ fontSize: 56, color: '#c9a227' }}>
              {number ? `#${String(number.number).padStart(4, '0')}` : ''}
            </div>
          </div>
          <div style={{ fontSize: 44 }}>{formatCents(cents(contribution.amountCents))}</div>
        </div>

        {/* The ember rule, matching the site's funding meter. */}
        <div style={{ display: 'flex', height: 3, background: '#8e1d22', width: '100%' }} />
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: font ? [{ name: 'Mono', data: font, style: 'normal' }] : undefined,
    },
  );
}
