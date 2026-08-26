/**
 * File-based fallback for `site_copy`. The DB-backed table slots in behind
 * `copy()` / `text()`; call sites never read this object directly.
 */
const copyDefaults = {
  'eyebrow.currently_building': 'CURRENTLY BUILDING',
  'eyebrow.top_business_sponsor': '#1 BUSINESS SPONSOR',
  'eyebrow.live': 'LIVE',

  'hero.artist_name': 'MJ COBE',
  'hero.tagline': 'SOUL HAS A NEW FACE.',
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

  'revealimage.placeholder_label': 'HERO IMAGE — PLACEHOLDER',

  'lookbook.hero_alt':
    'MJ COBE standing alone on a moonlit beach at night, wearing a striped beanie and a silver chain.',
  'lookbook.loop_alt':
    'MJ COBE in silhouette on an empty beach at night, facing the moonlit ocean.',

  // ---- Song page ---------------------------------------------------------
  'song.section.support': 'SUPPORT THIS RECORD',
  'song.section.supporters': 'TOP SUPPORTERS',
  'song.section.partners': 'OFFICIAL SONG PARTNERS',
  'song.section.updates': 'UPDATES',
  'song.section.journey': 'JOURNEY',
  'song.section.crown': 'THE #1 SPOT',
  'song.section.about': 'ABOUT THIS RECORD',

  'song.meter.raised': 'RAISED',
  'song.meter.goal': 'GOAL',
  'song.meter.supporters': 'SUPPORTERS',
  'song.meter.days_left': 'DAYS LEFT',
  'song.meter.final_day': 'FINAL DAY',
  'song.meter.closed': 'CLOSED',
  'song.meter.open_ended': 'OPEN',
  'song.meter.sponsorship_note':
    '{amount} committed by partners, tracked separately from the fan goal.',

  'song.proof_line': '{count} people were here before the world caught on.',
  'song.proof_line_empty': 'Nobody has backed this record yet. Someone has to be first.',

  'song.crown.leader': '{name} holds #1 with {amount}.',
  'song.crown.open': 'Nobody holds #1 yet. The spot is unclaimed.',
  'song.crown.cost': 'TAKE IT FOR',
  'song.crown.cta': 'CLAIM #1',
  'song.crown.increment': 'Minimum increment {amount}.',

  'song.tiers.heading': 'CHOOSE YOUR LEVEL',
  'song.tiers.select': 'SELECT',
  'song.tiers.sold_out': 'SOLD OUT',
  'song.tiers.remaining': '{count} LEFT',
  'song.tiers.custom': 'CUSTOM AMOUNT',

  'song.updates.locked': 'Unlocks at {amount} support.',
  'song.updates.locked_label': 'SUPPORTER ONLY',

  'song.empty.supporters': 'No supporters yet. The first name here is permanent.',
  'song.empty.partners':
    'No partners yet. The first brand here becomes the presenting partner.',
  'song.empty.updates': 'No updates published yet.',
  'song.empty.journey': 'The timeline starts with the first entry.',

  'song.closed.notice': 'This campaign has closed. The record continues.',
  'song.support_paused': 'Support is paused on this campaign.',

  'song.partners.more': '{count} more partners',
  'song.anonymous': 'Anonymous',
  'song.amount_hidden': 'Private',

  'simulation.ribbon': 'SIMULATION MODE — no card is charged',

  'notfound.code': '404',
  'notfound.title': 'NOTHING HERE',
  'notfound.body': 'The page you asked for does not exist, or is not public yet.',
  'notfound.cta': 'BACK TO THE MUSIC',

  // ---- Journey event kinds ----------------------------------------------
  'journey.kind.preview_uploaded': 'PREVIEW',
  'journey.kind.supporter_milestone': 'SUPPORTERS',
  'journey.kind.funding_milestone': 'FUNDING',
  'journey.kind.new_top_sponsor': 'PARTNER',
  'journey.kind.new_top_supporter': 'SUPPORTER',
  'journey.kind.production_update': 'STUDIO',
  'journey.kind.release': 'RELEASE',
  'journey.kind.video_release': 'VIDEO',
  'journey.kind.stream_milestone': 'STREAMS',
  'journey.kind.view_milestone': 'VIEWS',
  'journey.kind.campaign_opened': 'OPENED',
  'journey.kind.campaign_closed': 'CLOSED',
  'journey.kind.manual': 'NOTE',
} as const;

export type CopyKey = keyof typeof copyDefaults;

export function copy(key: CopyKey): string {
  return copyDefaults[key];
}

/** Client-safe interpolation for strings already resolved on the server. */
export function interpolate(
  raw: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
