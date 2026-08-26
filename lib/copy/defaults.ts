/**
 * File-based fallback for `site_copy`. The DB-backed table slots in behind
 * `copy()` in Slice 1; call sites never read this object directly.
 */
const copyDefaults = {
  'eyebrow.currently_building': 'CURRENTLY BUILDING',
  'eyebrow.top_business_sponsor': '#1 BUSINESS SPONSOR',
  'eyebrow.live': 'LIVE',

  'hero.artist_name': 'MJ COBE',
  'hero.tagline': "SOUL HAS A NEW FACE.",
  'hero.subcopy':
    'Original R&B. A new visual world. A career being built in real time.',

  'button.back_this_song': 'BACK THIS SONG',
  'button.sponsor_this_song': 'SPONSOR THIS SONG',
  'button.disabled_example': 'CAMPAIGN CLOSED',

  'tag.day_one': 'DAY ONE',
  'tag.founding_supporter': 'FOUNDING SUPPORTER',
  'tag.presenting_partner': 'PRESENTING PARTNER',

  'leaderboard.more_supporters': '{count} more supporters',
  'leaderboard.fan_heading': 'TOP FAN SUPPORTERS',
  'leaderboard.business_heading': 'OFFICIAL SONG PARTNERS',

  'lookbook.hero_alt':
    'MJ COBE standing alone on a moonlit beach at night, wearing a striped beanie and a silver chain.',
  'lookbook.loop_alt':
    'MJ COBE in silhouette on an empty beach at night, facing the moonlit ocean.',
} as const;

export type CopyKey = keyof typeof copyDefaults;

export function copy(key: CopyKey): string {
  return copyDefaults[key];
}
