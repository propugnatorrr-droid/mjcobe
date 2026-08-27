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

  'lookbook.hero_alt':
    'MJ COBE in close chest-up view on a moonlit beach at night, wearing a striped beanie, glasses and a silver chain.',
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

  // ---- Nav ---------------------------------------------------------------
  'nav.home': 'HOME',
  'nav.music': 'MUSIC',
  'nav.back_a_song': 'BACK A SONG',
  'nav.journey': 'JOURNEY',
  'nav.partners': 'PARTNERS',
  'nav.mj_cobe': 'MJ COBE',
  'nav.cta': 'BACK A RECORD',

  // ---- Home ---------------------------------------------------------------
  'home.listen': 'LISTEN',
  'home.currently_building': 'CURRENTLY BUILDING',
  'home.cta': 'BACK THIS SONG',
  'home.top_sponsor_heading': '#1 BUSINESS SPONSOR',
  'home.top_fan_heading': 'TOP FAN SUPPORTER',
  'home.empty': 'Nothing is currently building. Check back soon.',
  'home.new_single': 'NEW SINGLE',
  'home.view_project': 'VIEW PROJECT',
  'home.supporters': 'SUPPORTERS',
  'home.raised_toward': 'raised toward',
  'home.funded': 'FUNDED',

  // ---- Footer ---------------------------------------------------------------
  'footer.tagline': 'REAL MUSIC. REAL IMPACT.',
  'footer.rights': 'ALL RIGHTS RESERVED.',
  'footer.built': 'BUILT DIFFERENT. MADE TO LAST.',
  'footer.terms': 'TERMS',
  'footer.privacy': 'PRIVACY',
  'footer.contact': 'CONTACT',
  'footer.media_kit': 'MEDIA KIT',

  // ---- Music catalog --------------------------------------------------------
  'music.title': 'MUSIC',
  'music.released': 'RELEASED',
  'music.released_sub': 'AVAILABLE EVERYWHERE',
  'song.preview_coming_soon': 'PREVIEW COMING SOON',
  'song.preview_window': '30 SECOND PREVIEW',
  'song.of_goal': 'OF GOAL',
  'song.backed': 'BACKED',
  'song.campaign_goal': 'CAMPAIGN GOAL',
  'music.coming_soon': 'COMING SOON',
  'music.coming_soon_sub': 'LISTEN TO A PREVIEW',
  'music.building_now': 'BUILDING NOW',
  'music.building_now_sub': 'BE PART OF WHAT’S NEXT',
  'music.vault': 'VAULT',
  'music.join_the_journey': 'JOIN THE JOURNEY',
  'music.empty_section': 'Nothing here yet.',

  // ---- Global journey page -------------------------------------------------
  'journey.page.title': 'THE JOURNEY',
  'journey.page.sub': 'You were here before the world caught on.',
  'journey.page.empty': 'The timeline starts with the first entry.',
  'journey.filter.all': 'ALL',
  'journey.filter.milestones': 'MILESTONES',
  'journey.filter.supporters': 'SUPPORTERS',
  'journey.filter.sponsors': 'SPONSORS',

  // ---- Partners page --------------------------------------------------------
  'partners.title': 'BUILD WITH MJ COBE',
  'partners.sub':
    'Put your brand behind music, visuals and culture while the story is being created.',
  'partners.cta': 'PARTNER WITH MJ COBE',
  'partners.accepting_heading': 'CURRENT CAMPAIGNS ACCEPTING SPONSORS',
  'partners.packages_heading': 'SPONSORSHIP PACKAGES',
  'partners.view_campaign': 'VIEW CAMPAIGN',
  'partners.stats_heading': 'OUR IMPACT',
  'partners.stat.raised': 'RAISED FROM SPONSORS',
  'partners.stat.sponsor_count': 'BUSINESSES ON BOARD',
  'partners.past_sponsors': 'PAST & CURRENT SPONSORS',
  'partners.custom': 'Custom packages available. Let’s build something iconic together.',
  'partners.contact': 'Contact us at partners@mjcobe.com',
  'partners.package.digital': 'DIGITAL PARTNER',
  'partners.package.featured': 'FEATURED PARTNER',
  'partners.package.visual': 'VISUAL PARTNER',
  'partners.package.presenting': 'PRESENTING PARTNER',
  'partners.empty': 'No campaigns are currently accepting sponsors.',
  'partners.build_with': 'BUILD WITH',
  'partners.view_packages': 'VIEW PACKAGES',
  'partners.brand_packages': 'BRAND PACKAGES',
  'partners.seeking_sponsors': 'SEEKING SPONSORS',
  'partners.trusted_by': 'TRUSTED BY FORWARD-THINKING BRANDS',
  'partners.growing': 'GROWING EVERY DAY. REAL PEOPLE. REAL IMPACT.',
  'partners.stat.impressions': 'CAMPAIGN IMPRESSIONS',
  'partners.stat.supporters': 'SUPPORTERS',
  'partners.stat.songs': 'RECORDS BACKED',
  'partners.most_popular': 'MOST POPULAR',
  'partners.apply': 'APPLY TO PARTNER',

  // ---- Sponsor profile (/partner/[slug]) -------------------------------------
  'partner.official_supporter': 'OFFICIAL SUPPORTER OF',
  'partner.contributed': 'CONTRIBUTED',
  'partner.since': 'SUPPORTED MJ COBE SINCE {month} {year}',
  'partner.website': 'WEBSITE',
  'partner.instagram': 'INSTAGRAM',
  'partner.shop': 'SHOP',
  'partner.not_found': 'That partner profile doesn’t exist or isn’t public.',
  'partner.presenting': 'PRESENTING PARTNER',
  'partner.visit': 'VISIT SPONSOR',
  'partner.total_contribution': 'TOTAL CONTRIBUTION',
  'partner.brand_profile': 'BRAND PROFILE',
  'partner.official_partners': 'OFFICIAL SONG PARTNERS',

  // ---- /now (link-in-bio) page ----------------------------------------------
  'now.title': 'MJ COBE / RIGHT NOW',
  'now.new_music': 'NEW MUSIC',
  'now.back_next': 'BACK THE NEXT RECORD',
  'now.top_sponsor': '#1 SPONSOR',
  'now.latest_video': 'LATEST VIDEO',
  'now.watch': 'WATCH',
  'now.support_now': 'SUPPORT NOW',
  'now.join_inner_circle': 'JOIN MJ’S INNER CIRCLE',
  'now.inner_circle_sub': 'Exclusive updates. First access. Special invites.',
  'now.email_placeholder': 'Email address',
  'now.join': 'JOIN',
  'now.privacy_note': 'We respect your privacy. Unsubscribe anytime.',
  'now.subscribed': 'YOU’RE IN.',
  'now.subscribe_error': 'ENTER A VALID EMAIL.',
  'now.happening_now': 'HAPPENING NOW',
  'now.activity.fan': '{name} just backed {song} — {amount}',
  'now.activity.fan_anonymous': 'A supporter just backed {song} — {amount}',
  'now.activity.fan_hidden': '{name} just backed {song}',
  'now.activity.business': '{name} just sponsored {song} — {amount}',
  'now.social.instagram': 'INSTAGRAM',
  'now.social.tiktok': 'TIKTOK',
  'now.social.youtube': 'YOUTUBE',
  'now.social.x': 'X',
  'now.social.spotify': 'SPOTIFY',
  'now.social.apple_music': 'APPLE MUSIC',

  // ---- Supporter profile ---------------------------------------------------
  'supporter.since': 'MJ COBE SUPPORTER SINCE {year}',
  'supporter.songs_backed': 'SONGS BACKED',
  'supporter.total_contributions': 'TOTAL CONTRIBUTIONS',
  'supporter.badges': 'BADGES',
  'supporter.songs_helped': 'SONGS YOU HELPED BUILD',
  'supporter.not_found': 'That supporter profile doesn’t exist or isn’t public.',
  'supporter.no_badges': 'No badges earned yet.',
  'supporter.contributed': 'YOU CONTRIBUTED',
  'supporter.view_all_badges': 'VIEW ALL BADGES',
  'supporter.earned': 'EARNED',
  'supporter.songs': 'SONGS',

  // ---- Legal / contact ------------------------------------------------------
  'legal.terms.title': 'TERMS',
  'legal.privacy.title': 'PRIVACY',
  'legal.contact.title': 'CONTACT',
  'legal.contact.body':
    'For partnerships, press and anything else, reach the team at hello@mjcobe.com.',
  'legal.contact.partnerships': 'PARTNERSHIPS',
  'legal.contact.press': 'PRESS',
  'legal.contact.support': 'SUPPORT',
  'legal.placeholder':
    'This policy is being finalised with counsel and will be published here before the first live campaign closes.',
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
