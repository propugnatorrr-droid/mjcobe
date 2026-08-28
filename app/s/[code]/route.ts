import {
  NextResponse,
} from 'next/server';
import {
  eq,
  sql,
} from 'drizzle-orm';
import {
  dbw,
} from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import {
  resolveThanksToken,
} from '@/lib/checkout/tokens';

export const dynamic = 'force-dynamic';

const PRIVATE_HEADERS = {
  'Cache-Control':
    'private, no-store, max-age=0',
  'X-Robots-Tag':
    'noindex, nofollow, noarchive',
  'Referrer-Policy':
    'no-referrer',
};

function safeTargetPath(
  value: string,
): string {
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return '/';
  }

  return value;
}

/**
 * Counts a short-link visit, then forwards
 * only to a same-origin relative path.
 */
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      code: string;
    }>;
  },
) {
  const { code } = await params;

  const link =
    await resolveThanksToken(code);

  if (!link) {
    return NextResponse.redirect(
      new URL('/', request.url),
      {
        headers: PRIVATE_HEADERS,
      },
    );
  }

  await dbw
    .update(s.shareLinks)
    .set({
      clicks: sql`
        ${s.shareLinks.clicks} + 1
      `,
    })
    .where(
      eq(
        s.shareLinks.id,
        link.id,
      ),
    );

  const targetPath =
    safeTargetPath(
      link.targetPath,
    );

  return NextResponse.redirect(
    new URL(
      targetPath,
      request.url,
    ),
    {
      headers: PRIVATE_HEADERS,
    },
  );
}
