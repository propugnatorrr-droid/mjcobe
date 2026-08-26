# MJ COBE — Visual Law

Reference points: OVO lookbooks, Fenty product pages, SSENSE grid discipline,
A24 typography, Boiler Room / NTS editorial. Print-design confidence applied
to a music platform.

The site sells PROXIMITY TO THE BEGINNING. Every choice serves the sentence:
"486 people were here before the world caught on."

## BANNED — treat any of these as a build failure
- Purple/blue/indigo gradients. Any gradient text.
- Glassmorphism, backdrop-blur cards, neon glow, box-shadow glow on hover.
- Floating blobs, orbs, mesh gradients, aurora backgrounds.
- Rounded cards (`rounded-lg`+) with drop shadows. Card-grid layouts.
- Three-column icon+heading+paragraph "features" sections.
- Emoji as interface. Medal emoji in leaderboards.
- Bouncy/spring easing. Confetti. Tilt-on-hover. Scale-on-hover above 1.02.
- Centered-everything hero with a dark overlay on a stock photo.
- Pill-shaped progress bars.
- Pure #000 or pure #FFF.

## Color — exact values, no additions
--ink:        #0A0A0B   /* primary surface */
--ink-2:      #121214   /* raised surface */
--paper:      #F2EEE7   /* inverted surface (used on /partners) */
--paper-2:    #E5E0D7
--line:       rgba(255,255,255,0.10)   /* the layout language */
--line-strong:rgba(255,255,255,0.22)
--text:       #EDEAE4
--text-dim:   #8B8983
--text-faint: #56544F
--ember:      #8E1D22   /* LIVE / funding / active. Signal only. */
--champagne:  #C9A227   /* #1 RANK ONLY. Under 5% of any viewport. */

Rules: `--ember` never decorates — it only indicates money moving or a live
state. `--champagne` touches nothing except the #1 position and won-crown
states. Sponsor logos are force-normalized to monochrome knockout white; SVG
required at upload.

## Type
Display:  PP Editorial New  (fallback: Instrument Serif)
UI:       Neue Montreal     (fallback: Geist)
Numerals: any true mono with TABULAR figures (fallback: Geist Mono)

- Display: `clamp(3rem, 12vw, 11rem)`, tracking `-0.03em`, line-height 0.92.
  Italic display allowed only at huge sizes, sparingly, for emotional beats.
- Labels/eyebrows: mono, UPPERCASE, 11px, tracking `0.18em`, `--text-dim`.
- Body: 16–18px, line-height 1.55, max-width 62ch.
- EVERY NUMBER IS TABULAR MONO. Counters must never reflow width.

## Structure
- Hairlines, not cards. `1px solid var(--line)` separating full-bleed rows IS
  the layout system.
- Border-radius: `2px` max, `0` preferred.
- 12-col grid, wide margins, deliberately asymmetric. Example: song cover
  bleeds off the left edge cols 1–6; leaderboard sits cols 8–12.
- Section padding: 96px mobile / 200px desktop. Be generous. Empty space is
  the luxury signal.

## The progress bar (highest-stakes component)
NOT a pill. A 2px rule with tick marks like a film timecode or console meter.
Percentage set in mono ABOVE the rule, right-aligned to the fill head.
Fill is `--ember`. Track is `--line`. Ticks at 10% intervals in `--text-faint`.
On mount it animates left-to-right once over 900ms, then holds. Never pulses.

## The leaderboard
Film end-credits crossed with a chart.
`01 / 02 / 03` in mono `--text-faint`. Name left, amount right-aligned tabular.
Hairline between rows. Row height ~64px desktop.
#1 gets ONE champagne hairline above it and its rank number in champagne.
Nothing else. No avatars unless a real uploaded image exists. No badges as
stickers — badges render as mono uppercase text tags with a hairline border.

## Texture (the actual anti-AI-flatness measure)
- Global film grain: SVG `feTurbulence` overlay, 3–5% opacity, `mix-blend-mode:
  overlay`, animated at 8fps. Static if `prefers-reduced-motion`.
- Hero imagery: subtle chromatic vignette, corners ~12% darker.
- Secondary photography: duotone (ink → paper) at 85% for editorial cohesion.

## Motion
- Duration 300–500ms. Easing `cubic-bezier(0.16, 1, 0.3, 1)`. Only that.
- Images reveal by `clip-path` wipe. NEVER fade-and-scale.
- Text reveals line-by-line under a mask, 60ms stagger.
- Numbers count up once on viewport entry, then hold forever.
- Parallax capped at 8% translate.
- Route transitions: fast black wipe.
- Everything above respects `prefers-reduced-motion: reduce`.

## Audio
Persistent docked mini-player that survives navigation: one global `<audio>`
element in a Context provider, never remounted. Waveform scrub from
`peaks.json`. One editorial flourish only — hero grain intensity responds
subtly to playback amplitude. One flourish executed perfectly beats five.

## Inversion
`/partners` is paper-white with black type, set like a printed media kit.
The tonal flip is what makes it read as a deck rather than a donation page.

## Accessibility (non-negotiable, and it does not conflict with the above)
- Body text ≥ 4.5:1. Large display text ≥ 3:1. `--text-faint` is for
  decorative numerals only, never for content.
- Visible focus ring: 2px `--champagne` offset 2px. Never `outline: none`.
- Grain and duotone layers are `pointer-events: none` and `aria-hidden`.
- Every interactive element reachable and operable by keyboard.
