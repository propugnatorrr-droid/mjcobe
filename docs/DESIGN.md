# MJ COBE — Visual Law

Reference: the client-approved mockups in `mj cobe site mockups` (12 desktop
+ 12 mobile concepts, covering every page in the PRD). This document is the
checkable record of that direction — build against this file, not against
the mockup images directly.

The site sells PROXIMITY TO THE BEGINNING. Every choice serves the sentence:
"486 people were here before the world caught on."

## Revision note
This replaces an earlier, stricter editorial-minimalist direction (hairlines
only, champagne restricted to #1, no icons, no rounded corners). That
direction is gone — the client confirmed the mockups are the real target.
What survives: the dark ink surface, tabular numerals, the signature easing
curve, film grain, and the core psychology. What's reversed: gold is now the
primary brand accent (not a restricted signal), corners are rounded, icons
are a real UI language, the funding meter is a pill, and leaderboard ranks
1–3 get real medal badges.

## BANNED — treat any of these as a build failure
- Purple/blue/indigo gradients. Any gradient text.
- Backdrop-blur glassmorphism cards, floating blobs/orbs, mesh gradients,
  aurora backgrounds.
- Bouncy/spring easing. Confetti. Tilt-on-hover. Scale-on-hover above 1.02.
- Centered-everything hero with a dark overlay on a stock photo.
- Pure #000 or pure #FFF.
- Literal emoji characters as interface (🥇🏆 etc.) — the medal/trophy/star
  glyphs are real SVG icons (lucide-react), never emoji, so rendering is
  consistent across OS/browser instead of depending on the system emoji font.

## Color — exact values
--ink:        #0A0A0B   /* primary surface, every page */
--ink-2:      #121214   /* raised surface */
--paper:      #F2EEE7   /* reserved; not currently used by any page */
--paper-2:    #E5E0D7
--line:       rgba(255,255,255,0.10)   /* hairlines still separate rows */
--line-strong:rgba(255,255,255,0.22)
--text:       #EDEAE4
--text-dim:   #8B8983
--text-faint: #56544F
--ember:      #8E1D22   /* LIVE / funding-in-progress signal only */
--champagne:  #C9A227   /* PRIMARY BRAND ACCENT — see below */

`--champagne` is now the primary gold accent used throughout: CTAs, active
nav state, labels, chart lines, borders, badge fills, the #1 rank. Measured
8.18:1 against `--ink` — safe at any text size, not just large/decorative
use. `--ember` still means "money is moving right now" specifically (a
settling transaction, a live campaign state) and never decorates. Sponsor
logos are force-normalized to monochrome knockout white; SVG required at
upload.

No paper-surface inversion is currently used anywhere — every page in the
mockups, including partners/sponsor pages, stays on the ink surface. The
`.surface-paper` CSS mechanism stays defined in `globals.css` in case a
future page needs it, but nothing currently switches to it.

## Type
Two families:
- **Display** — **Tanker** (Fontshare / Indian Type Foundry, ITF Free Font
  License, self-hosted via `next/font/local`), a condensed poster-style
  face for headlines and the wordmark. Single weight, no italic.
- **UI, numerals, labels** — **Switzer** (same license terms), carrying
  everything mono used to before: body text, buttons, and every number.
  Not monospace, but its `tnum` feature gives genuinely equal-width tabular
  figures (verified empirically).

No component ever names either typeface — everything goes through
`--font-display`, `--font-ui`, `--font-mono` (see `app/globals.css`).

- Display: `clamp(3rem, 12vw, 11rem)`, tracking tight, line-height ~0.92.
- Labels/eyebrows: UPPERCASE, 11px, tracking `0.18em`.
- Body: 16–18px, line-height 1.55, max-width 62ch.
- EVERY NUMBER IS TABULAR. Counters must never reflow width.

## Structure
- Rounded corners are the norm now: **8px** for cards/inputs/panels, **full
  pill** (9999px) for buttons, tags, and the funding meter. This is a real
  reversal of the earlier "2px max" rule.
- Hairlines (`1px solid var(--line)`) still separate rows inside a panel
  (leaderboard rows, transaction tables) — panels themselves are now
  rounded-8px containers with a `var(--line)` border, not just bare hairline
  dividers on the page background.
- 12-col grid, wide margins, deliberately asymmetric hero compositions.
- Section padding: 96px mobile / 200px desktop. Still generous.
- Icons are a real UI language now (lucide-react — plain MIT-licensed stroke
  glyphs, not a themed component library): star, crown, trophy, lock,
  shield, dollar-circle, headphones, people, chart, camera. Used at label
  scale (16–20px) beside text, never as full decorative illustration.

## The progress bar
A pill: rounded-full track in `var(--line)`, rounded-full fill in
`var(--champagne)`. Percentage set beside or above the bar, tabular. No tick
marks. On mount it animates left-to-right once over 900ms, then holds.
Never pulses.

## The leaderboard
Real leaderboard, real stakes. Rank badges: **1st/2nd/3rd get an actual
medal-ribbon SVG icon** (gold/silver/bronze), rank 4+ gets a plain tabular
number in `--text-dim` (content, not decoration — `--text-faint` stays
reserved for genuinely decorative marks only). Avatar circle before the
name — a real uploaded photo if one exists, otherwise a monogram (first
letter of the display name) on an `--ink-2` circle. Amount right-aligned,
tabular. Hairline between rows inside the panel. Row height ~64px desktop.

Badges elsewhere (supporter profile, tier grid) render as a small
icon-in-circle medallion with a label underneath — not a hairline text tag.

## Glow — capped, not banned
A soft `box-shadow` glow is now sanctioned, but only in two places: the
primary hero CTA ("BACK A RECORD" / "SUPPORT THIS SONG") and the #1
slot/crown moment. One definition, reused: `--glow-champagne` in
`globals.css`. Never on hover-only states, never on more than one element
per view.

## Texture (the actual anti-AI-flatness measure)
- Global film grain: SVG `feTurbulence` overlay, 3–5% opacity, `mix-blend-mode:
  overlay`, animated at 8fps (stepped `background-position` over a static
  tile — never re-running `feTurbulence` itself every frame). Static if
  `prefers-reduced-motion`.
- Hero imagery: subtle chromatic vignette, corners ~12% darker.
- Secondary photography: duotone (ink → paper) at 85% for editorial cohesion.
- The banned-gradient rule targets decorative UI/background/text gradients.
  A photographic vignette or duotone applied as a treatment layer over real
  imagery is the sanctioned exception — it's grading, not decoration.

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
`peaks.json`. Hero grain intensity responds subtly to playback amplitude.

## Accessibility (non-negotiable, and it does not conflict with the above)
- Body text ≥ 4.5:1. Large display text ≥ 3:1. `--text-faint` is for
  decorative marks only (e.g. a divider glyph), never for content — rank
  numbers and any other reader-facing figure use `--text-dim` (5.66:1 on
  ink) or better.
- Visible focus ring: 2px `--champagne` offset 2px. Never `outline: none`.
- Grain and duotone layers are `pointer-events: none` and `aria-hidden`.
- Every interactive element reachable and operable by keyboard.
- Icons that carry meaning (not purely decorative) get an accessible name;
  purely decorative icons are `aria-hidden`.
