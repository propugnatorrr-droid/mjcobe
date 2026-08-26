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
    // ---- Checkout ----------------------------------------------------------
  'checkout.fan.heading': 'BACK THIS RECORD',
  'checkout.business.heading': 'SPONSOR THIS RECORD',
  'checkout.step.amount': 'AMOUNT',
  'checkout.step.identity': 'HOW YOU APPEAR',
  'checkout.step.business': 'YOUR BUSINESS',
  'checkout.step.payment': 'PAYMENT',
  'checkout.custom_amount': 'OTHER AMOUNT',
  'checkout.custom_placeholder': 'Enter an amount',
  'checkout.submit.fan': 'COMPLETE SUPPORT',
  'checkout.submit.business': 'SUBMIT SPONSORSHIP',
  'checkout.working': 'WORKING',

  'checkout.field.email': 'EMAIL',
  'checkout.field.display_name': 'DISPLAY NAME',
  'checkout.field.instagram': 'INSTAGRAM',
  'checkout.field.city': 'CITY',
  'checkout.field.anonymous': 'Show me as anonymous',
  'checkout.field.hide_amount': 'Hide my amount publicly',
  'checkout.field.business_name': 'BUSINESS NAME',
  'checkout.field.rep_name': 'REPRESENTATIVE',
  'checkout.field.phone': 'PHONE',
  'checkout.field.website': 'WEBSITE',
  'checkout.field.industry': 'INDUSTRY',
  'checkout.field.message': 'MESSAGE',
  'checkout.field.optional': 'OPTIONAL',

  'checkout.consent.fan':
    'Contributions are voluntary support for MJ COBE\u2019s creative and promotional campaigns and do not provide ownership, equity, royalties, securities, repayment rights or financial returns.',
  'checkout.consent.fan_checkbox':
    'I understand this contribution is support and does not represent an investment, ownership interest, royalty interest or promise of financial return.',
  'checkout.consent.business':
    'Sponsorship does not provide ownership of MJ COBE or the underlying music. Sponsorship purchases promotional placement and participation in the campaign.',
  'checkout.consent.business_checkbox':
    'I understand sponsorship benefits are limited to the promotional benefits described for this campaign and are subject to approval by MJ COBE Management.',

  'checkout.error.amount': 'Enter an amount between {min} and {max}.',
  'checkout.error.email': 'Enter a valid email address.',
  'checkout.error.display_name': 'Display name must be {max} characters or fewer.',
  'checkout.error.business_name': 'Enter your business name.',
  'checkout.error.consent': 'Please confirm the statement above to continue.',
  'checkout.error.closed': 'This campaign is not accepting support right now.',
  'checkout.error.declined': 'That payment was declined. No charge was made.',
  'checkout.error.generic': 'Something went wrong. No charge was made.',
  'checkout.error.blocked': 'This submission cannot be accepted.',

  'checkout.choose_song': 'CHOOSE A RECORD',
  'checkout.no_open_campaigns': 'No campaigns are open right now.',
  'checkout.minimum_to_lead': 'Minimum to take #1 is {amount}.',
  'checkout.packages': 'SPONSORSHIP PACKAGES',
  'checkout.approval_note':
    'Sponsorships above {amount} are reviewed before they appear publicly.',

  // ---- Confirmation ------------------------------------------------------
  'thanks.heading': 'YOU\u2019RE PART OF THE JOURNEY.',
  'thanks.subhead': 'You just backed \u201C{song}\u201D.',
  'thanks.subhead_business': '{business} is now backing \u201C{song}\u201D.',
  'thanks.supporter_number': 'YOUR SUPPORTER NUMBER',
  'thanks.founding_number': 'FOUNDING SUPPORTER',
  'thanks.rank': 'YOUR RANKING',
  'thanks.amount': 'CONTRIBUTED',
  'thanks.pending.heading': 'SUBMITTED FOR REVIEW.',
  'thanks.pending.body':
    'Your sponsorship is with MJ COBE Management. You will hear back by email, and nothing appears publicly until it is approved.',
  'thanks.share': 'SHARE MY SUPPORT',
  'thanks.view_song': 'VIEW SONG JOURNEY',
  'thanks.back_another': 'BACK ANOTHER RECORD',
  'thanks.copy_link': 'COPY LINK',
  'thanks.copied': 'COPIED',
  'thanks.download': 'DOWNLOAD GRAPHIC',
  'thanks.og.line': 'I BACKED MJ COBE',
} as const;

export type CopyKey = keyof typeof copyDefaults;

export function copy(key: CopyKey): string {
  return copyDefaults[key];
}
export const copyKeys = Object.keys(copyDefaults) as CopyKey[];
/** Client-safe interpolation for strings already resolved on the server. */
export function interpolate(
  raw: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
