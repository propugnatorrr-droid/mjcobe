/**
 * File-based fallback for `settings`. The DB-backed table slots in behind
 * `config()` in Slice 1; call sites never read this object directly.
 */
const configDefaults = {
  currency: 'USD',
  locale: 'en-US',
  meterAnimationMs: 900,
  revealTextStaggerMs: 60,
  grainOpacity: 0.04,
  grainFps: 8,
  leaderboardVisibleRows: 5,

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
