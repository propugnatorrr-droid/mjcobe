import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';

/** A tracked promo link (PRD §39): `mjcobe.com/r/ABC` logs a real visit
 * then forwards to the song it points at. No fabricated click counts —
 * the admin view counts these rows directly. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const [link] = await db
    .select({ id: s.referralLinks.id, campaignId: s.referralLinks.campaignId })
    .from(s.referralLinks)
    .where(eq(s.referralLinks.code, code))
    .limit(1);
  if (!link) notFound();

  let songSlug: string | null = null;
  if (link.campaignId) {
    const [campaign] = await db
      .select({ songId: s.campaigns.songId })
      .from(s.campaigns)
      .where(eq(s.campaigns.id, link.campaignId))
      .limit(1);
    if (campaign) {
      const [song] = await db
        .select({ slug: s.songs.slug })
        .from(s.songs)
        .where(eq(s.songs.id, campaign.songId))
        .limit(1);
      songSlug = song?.slug ?? null;
    }
  }

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim();

  await dbw.insert(s.referralVisits).values({
    referralLinkId: link.id,
    sessionId: crypto.randomUUID(),
    ipHash: ip ? createHash('sha256').update(ip).digest('hex') : null,
    userAgent: h.get('user-agent') ?? null,
  });

  const destination = new URL(songSlug ? `/song/${songSlug}` : '/', request.url);
  return NextResponse.redirect(destination, { status: 302 });
}
