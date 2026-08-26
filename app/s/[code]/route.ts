import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { resolveThanksToken } from '@/lib/checkout/tokens';

/** Short share link: counts the click, then forwards to the song. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const link = await resolveThanksToken(code);
  if (!link) return NextResponse.redirect(new URL('/', _request.url));

  await dbw
    .update(s.shareLinks)
    .set({ clicks: sql`${s.shareLinks.clicks} + 1` })
    .where(eq(s.shareLinks.id, link.id));

  return NextResponse.redirect(new URL(link.targetPath, _request.url));
}
