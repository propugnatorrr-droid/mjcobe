import { NextResponse } from 'next/server';
import { notFound } from 'next/navigation';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { setting } from '@/lib/config/settings';
import type { ConfigKey } from '@/lib/config/defaults';

const PLATFORMS: Record<string, ConfigKey> = {
  instagram: 'socialInstagramUrl',
  tiktok: 'socialTiktokUrl',
  youtube: 'socialYoutubeUrl',
  x: 'socialXUrl',
  spotify: 'socialSpotifyUrl',
  'apple-music': 'socialAppleMusicUrl',
};

/** Every social link on /now routes through here so clicks are real,
 * counted events (analytics_events), never a displayed-but-fabricated number. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const settingKey = PLATFORMS[platform];
  if (!settingKey) notFound();

  const url = await setting(settingKey);
  if (!url || typeof url !== 'string') notFound();

  await dbw.insert(s.analyticsEvents).values({
    kind: 'social_click',
    sessionId: crypto.randomUUID(),
    path: `/api/go/${platform}`,
    meta: { platform },
  });

  return NextResponse.redirect(url, { status: 302 });
}
