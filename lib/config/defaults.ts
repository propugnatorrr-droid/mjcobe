/**
 * File-based fallback for `settings`. The DB-backed table slots in behind
 * `config()` / `setting()`; call sites never read this object directly.
 */
const configDefaults = {
  currency: 'USD',
  locale: 'en-US',
  /** Fixed zone so server-rendered dates never disagree with a client re-render. */
  displayTimeZone: 'UTC',

  meterAnimationMs: 900,
  revealTextStaggerMs: 60,
  grainOpacity: 0.04,
  grainFps: 8,
  leaderboardVisibleRows: 5,

  // Ranking / bidding floors. Campaign rows may override per campaign.
  minBidCents: 1_000,
  minIncrementCents: 50_000,
  fanIncrementCents: 100,
  meterIncludesSponsorship: false,

  // Song page density.
  updatesVisibleCount: 3,
  journeyVisibleCount: 6,

    // Checkout bounds. Admin-overridable via the settings table.
  minContributionCents: 500,
  maxContributionCents: 5_000_000,
  sponsorMinContributionCents: 25_000,
  displayNameMaxLength: 32,
  /** Above this, a sponsor is held for manual approval unless the campaign opts out. */
  sponsorApprovalThresholdCents: 100_000,

  // Asset pipeline — widths are capped at each source asset's native
  // resolution (never upscaled); see scripts/process-assets.ts.
  heroImageWidths: [640, 1008],
  placeholderSize: 20,
  photoGrainOpacity: 0.035,
  photoVignetteDarken: 0.12,
  videoMaxBytes: 1_000_000,
} as const;

export type ConfigKey = keyof typeof configDefaults;

export function config<K extends ConfigKey>(key: K): (typeof configDefaults)[K] {
  return configDefaults[key];
}
