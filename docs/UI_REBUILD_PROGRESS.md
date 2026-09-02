# UI Rebuild — Progress

Continuation source for the full public + admin UI rebuild. If a session runs
out of context mid-rebuild, start here: read "Work batches" for what's done
and what's next, then keep going — don't re-audit from scratch.

## Correction to the original brief

The brief that kicked this off assumed a mostly-broken, sparse design system
("globals.css has become an oversized collection of overlapping visual
phases," admin pages as "technical forms," etc.). After actually reading the
code, that's not accurate everywhere:

- `app/globals.css` already had a real, deliberate design-token system
  (colors/type/motion/spacing/radius) with citations back to `docs/DESIGN.md`
  and comments explaining *why* each value was chosen.
- `SiteNav`, `SiteFooter`, `MobileCta`, `MobileNavToggle` already had proper
  BEM-ish naming, ARIA attributes, focus trapping, Escape-to-close, and body
  scroll lock — i.e. already met the bar Phase 1D asked for.
- The `v2`/`v4`/`v5`/`v6`/`v7` suffixes are sequential **build-phase**
  numbers (this same kind of phased build, done before), not three
  competing design systems glued together.

What *was* real and verified by reading the code (not assumed from the
brief):

- **The homepage was genuinely thin.** `app/page.tsx` was exactly
  `SiteNav → HomeHero → FeaturedCampaign (or empty state) → SiteFooter →
  MobileCta`. No building-songs row, no released row, no journey spotlight,
  no partner proof, no closing CTA.
- **The silent-first-row bug was real**, at the old `app/page.tsx:23-25`:
  `catalog.find((song) => song.status === 'building') ?? null`. Same pattern
  at `app/now/page.tsx:92-95` (not yet fixed — see Work batches).
- **`visual-phase-6.css` fully shadowed `globals.css`'s home-page CSS.**
  Both files defined `.home-v2-hero`, `.home-campaign-*`, etc., with
  different values, and because `visual-phase-6.css` imported *after*
  `globals.css` in `app/layout.tsx`, it won every single collision via
  plain CSS cascade order. Roughly 550 lines of `globals.css` were dead
  code that never rendered. This is now fixed (see below) — that file is
  deleted, not just deduped in place.
- **The baseline build/typecheck was broken before any of this work
  started** — `npm install` had never been run for `stripe`,
  `@stripe/react-stripe-js`, `@stripe/stripe-js`, `@vercel/blob` despite
  them being in `package.json`. Fixed by running `npm install`
  (`package-lock.json` diff is that, nothing else).

## Baseline (before this work), captured 2026-09-02

- `git status`: clean, `main`, up to date with `origin/main`, last commit
  `66a4be3 Update status.ts`.
- `npm run typecheck`: **failed** — 13 errors, all "Cannot find module
  'stripe'/'@vercel/blob'/etc." Root cause: deps never installed, not a code
  problem. Fixed by `npm install`.
- `npm test`: 149 passing tests across 14 files, 1 failing suite
  (`tests/referral-attribution.test.ts` — imports a `server-only` module
  from a path Vitest treats as a client module; pre-existing, unrelated to
  missing deps, **not yet fixed**, see Work batches).
- `npm run lint`: 3 pre-existing errors — `app/api/analytics/route.ts:196`
  (`prefer-const`), `components/MobileNavToggle.tsx:60`
  (`react-hooks/set-state-in-effect`), `components/admin/SongUpdateCard.tsx:40`
  (`react-hooks/purity`, calls `Date.now()` at render). Plus assorted
  pre-existing warnings (unused vars, `<img>` vs `next/image`). **Not yet
  fixed** — none of these are in files this batch touched.
- `npm run build`: after `npm install`, built clean, all 16 route groups
  generated.

## Route inventory

**Public:** `/`, `/music`, `/back`, `/journey`, `/now`, `/partners`,
`/partner/[slug]`, `/song/[slug]`, `/song/[slug]/sponsor`,
`/song/[slug]/sponsors`, `/song/[slug]/supporters`, `/supporter/[id]`,
`/thanks/[token]`, `/legal/[doc]` (terms/privacy/contact), `/dev/gallery`.

**Admin:** `/admin`, `/admin/login`, `/admin/analytics`, `/admin/audit`,
`/admin/blocklist`, `/admin/campaigns`, `/admin/contributions`,
`/admin/copy`, `/admin/journey`, `/admin/media`, `/admin/notifications`,
`/admin/offline`, `/admin/referrals`, `/admin/settings`, `/admin/songs`,
`/admin/songs/[id]`, `/admin/songs/new`, `/admin/sponsors`,
`/admin/sponsors/[id]`, `/admin/sponsors/manage`.

**API (UI-relevant):** `/api/admin/song-media/upload`, `/api/analytics`,
`/api/cron/notifications`, `/api/cron/reconcile`, `/api/go/[platform]`,
`/api/og/thanks/[token]`, `/api/share/thanks/[token]/[format]`,
`/api/webhooks/stripe`, `/r/[code]`, `/s/[code]`.

## DB schema (for reference — see `lib/db/schema/*.ts`)

Real tables, not the brief's guessed names: `media_assets`,
`lookbook_assets`, `songs`, `campaigns` (separate from songs per PRD §43),
`support_tiers`, `sponsor_packages`, `gated_assets`, `journey_events`,
`song_updates`, `campaign_milestones`, `social_assets`, `share_links`,
`contributions`, `transactions`, `refunds`, `ledger_entries` (append-only —
balances are always derived, never stored), `disputes`, `consent_records`,
`invoices`, `webhook_events`, `idempotency_keys`, `users`, `supporters`,
`supporter_numbers`, `badges`, `badge_grants`, `rank_snapshots`,
`entitlement_grants`, `asset_access_log`, `notifications`,
`notification_prefs`, `settings`, `site_copy`, `feature_flags`,
`admin_users`, `audit_log`, `blocklist`, `moderation_queue`,
`referral_links`, `referral_visits`, `newsletter_subscribers`,
`analytics_events`, `sponsor_categories`, `sponsors`, `sponsor_bids`,
`exclusivity_locks`, `impressions`, `contracts`.

Status enums (`lib/db/schema/enums.ts`): `song_status` = draft / building /
coming_soon / released / vault. `campaign_status` = draft / live / funded /
closed / archived. `media_assets` has **no focal-point fields** — if that
becomes a real blocker (see Phase 2 in the original brief), it needs a
migration; not attempted yet.

## Work batches

### ✅ Batch 1 — Baseline fix + Phase 0 audit
- `npm install` to fix the broken baseline (missing `stripe`,
  `@stripe/react-stripe-js`, `@stripe/stripe-js`, `@vercel/blob`).
- Full route/schema/settings/copy/feature-flag/CSS inventory (this doc).

### ✅ Batch 2 — Style consolidation (partial Phase 1) + homepage rebuild (Phase 3)
Scope: only the home-page and shared-shell CSS, not the whole app.

- Created `app/styles/{tokens,base,navigation,home}.css`.
  - `tokens.css`: all color/spacing/radius/motion custom properties, plus
    the `--brand-gold-*`/`--control-radius`/`--card-radius`/
    `--public-header-background`/`--glow-champagne` tokens that used to be
    declared a second time inside `visual-phase-6.css`.
  - **`@theme inline { ... }` stays in `app/globals.css` itself, not in
    `tokens.css`.** Verified by build: Turbopack's Tailwind v4 integration
    only expands `@theme` in the file that directly follows
    `@import "tailwindcss"`; inside a plain `@import`ed partial it's passed
    through as literal CSS and silently dropped, taking every Tailwind
    utility that reads those tokens with it. This is documented in both
    files — don't "finish the migration" by moving it without re-verifying.
  - `base.css`: reset, focus-visible, reduced-motion, `.site-shell`/
    `.panel`/`.section-space` utilities.
  - `navigation.css`: `.mj-button`, `.site-nav__*`, `.mobile-cta__*` (moved
    from `visual-phase-6.css`, already unversioned).
  - `home.css`: `.home-hero-*` (renamed from `.home-v2-*`) and
    `.home-campaign-*`, using `visual-phase-6.css`'s values (the ones that
    were actually winning the cascade), plus new classes for the sections
    below.
- Deleted `app/visual-phase-6.css` entirely (fully migrated) and removed
  its import from `app/layout.tsx`.
- Deleted dead code that was never migrated because nothing references it:
  `globals.css`'s old `.catalog-grid`/`.catalog-song-*` block and
  `.song-hero-backdrop`/`.song-vinyl` block — zero `.tsx` references,
  confirmed by grep before deleting.
- Renamed `home-v2-*` → `home-hero-*` in `components/home/HomeHero.tsx` to
  match.
- **`lib/home/queries.ts`** (new): `getHomeComposition()` — one query
  aggregating featured campaign, other building songs, released songs,
  latest journey entry, and approved partners for the homepage. Featured
  selection order, all documented in code:
  1. `homeFeaturedCampaignId` setting, if set and the campaign it names is
     still `building`/`coming_soon`.
  2. Otherwise, the newest `live` campaign by `campaigns.created_at`
     (a real query, not a re-read of catalog sort order).
  3. Otherwise, first eligible catalog row (last-resort only).
  Never `catalog.find(status === 'building')` as the primary path.
- New settings (`lib/config/defaults.ts`): `homeFeaturedCampaignId` (empty
  = unset), `homeBuildingLimit` (3), `homeReleasedLimit` (3),
  `homeJourneyLimit` (1), `homePartnersLimit` (6). These slot into the
  existing generic admin settings page (`/admin/settings` +
  `lib/admin/queries.ts:listSettings()` + the "+ New setting" row) with no
  new admin UI needed — verified that page's mechanism is already generic
  key/value, not hardcoded to a specific key list.
- New copy keys (`lib/copy/defaults.ts`, `home.*` prefix): reused existing
  `music.*`/`journey.*`/`partners.*` keys wherever the same label was
  already in use elsewhere (e.g. `music.released`, `journey.kind.*`) rather
  than inventing near-duplicates.
- New components, all reusing existing primitives rather than duplicating
  card/row markup:
  - `components/home/HomeCatalogRow.tsx` — reuses `CatalogSongCard` (the
    same card `/music` uses) for both the "more building" and "released"
    rows.
  - `components/home/JourneySpotlight.tsx` — latest journey entry, reuses
    `lib/journey/icons.ts` and `lib/song/queries.ts:formatDay`.
  - `components/home/PartnerStrip.tsx` — approved-partner logo row, same
    data source as `/partners`' roster section (`getPartnersPage().sponsors`).
  - `components/home/HomeFinalCta.tsx` — closing "BACK A RECORD" panel
    before the footer (closes the "large dead space above the footer" gap).
- Rewrote `app/page.tsx` to compose all of the above.

**Verified**, not just implemented:
- `npm run typecheck` — clean.
- `npm run lint` — clean (0 new errors/warnings; the 3 pre-existing errors
  above are untouched).
- `npm run build` — clean, no CSS warnings (there were two intermediate
  warnings while getting the `@theme` and a comment-parsing issue right —
  both root-caused and fixed, not worked around).
- `npm test` — 149 passing, same single pre-existing failure as baseline.
- Live-rendered via dev server and checked (DOM text dump + JS geometry
  audit, since the browser pane's screenshot capture was unreliable in this
  environment — repeated ghosting/black-frame artifacts even though the
  DOM/image/console checks all came back clean):
  - Homepage now shows hero → featured campaign → "more building" row →
    "released" row → journey spotlight → partner strip → final CTA →
    footer. No gaps between sections (each section's measured `top` lines
    up with the previous section's `top + height`).
  - **Confirmed the featured-song fix actually changed behavior**: the
    featured campaign is now "LOWER FREQUENCY" ($0 raised — genuinely the
    newest live campaign), not "CAN'T READ YOUR MIND" (which the old
    first-building-row bug always picked, and which still correctly
    appears in the "more building" row, at $18,420/486 supporters).
  - Released row shows "SOME REAL" and "NIGHT SHIFT" with streaming links,
    no funding meter (correct released-state treatment).
  - Partner strip shows exactly 6 names, matching `homePartnersLimit`.

**Also created:** `.claude/launch.json` (dev-server config for the preview
tool — didn't exist before; needed to run the app at all for verification).

**Housekeeping:** a stale `next dev` process (PID 10624) was left running
from a prior session, holding a file-watch reference to the just-deleted
`visual-phase-6.css` and hanging on every request. Killed it before
verifying. If a future session sees the dev server hang or 404 on a
recently-deleted CSS file, check for a zombie process first
(`netstat -ano | grep :3000`, `tasklist | grep node`) before assuming the
code is broken.

### ✅ Batch 3 — Fixed the same silent-first-row bug on `/now`
- `lib/home/queries.ts`'s featured-resolution logic exported as
  `resolveFeaturedCampaign(catalog)` (was a private `resolveFeatured`).
- `app/now/page.tsx` now calls it instead of its own
  `catalog.find((s) => s.status === 'building') ?? catalog.find((s) => s.status
  === 'released') ?? null`. Also fixes a small product-logic issue in the old
  code: falling back to a *released* song for a "BACK THE NEXT RECORD" panel
  didn't make sense (you can't back a released song the same way) — the panel
  now just doesn't render if nothing is currently biddable, via the existing
  `{featured ? (...) : null}` guard.
- Verified: typecheck/lint/build all clean, same as Batch 2's bar.

### ⬜ Not done yet — next batches, roughly in priority order

1. **Media/art-direction audit (original brief's Phase 2).** Not started.
   `media_assets` has no focal-point columns — decide whether that's
   actually needed before adding a migration for it (the brief assumed
   images were wrong/missing; a quick grep found *no* external/placeholder
   URLs in the codebase, so re-verify this is a real problem on real data
   before spending a migration on it).
2. **Music catalog (`/music`), Phase 4.** `visual-phase-2.css` +
   `visual-phase-6-music.css` still carry `music-v2-*` (not yet
   de-versioned) — note the audit found `.music-v2-card*` rules
   **defined twice**, identically named, in both files; dedupe when this
   batch happens.
3. **Song page (`/song/[slug]`), Phase 5.** `visual-phase-2.css` (song hero
   + funding/crown/tiers dashboard) and `visual-phase-7-song.css` still
   fully versioned (`song-v2-*`). Not touched.
4. **Checkout (`/back`, fan/sponsor checkout), Phase 6.** `visual-phase-3.css`
   (`checkout-v3-*`). Not touched.
5. **Journey/partners/artist/supporter pages, Phase 7.**
   `visual-phase-4.css` (`journey-v4-*`, `now-v4-*`). Not touched.
6. **Admin UX, Phase 8.** `visual-phase-5.css` (`admin-v5-*`). Not touched.
   Note from the audit: `lib/admin/SponsorPackageForm.tsx` is a stray
   byte-for-byte duplicate of `components/admin/SponsorPackageForm.tsx` —
   delete the one in `lib/admin/` when this batch happens (it's a
   `.tsx` file sitting in a folder that otherwise holds only server
   actions/queries).
7. **Responsive/accessibility/visual QA pass, Phase 9.** Not started
   (Playwright not installed).
8. **Pre-existing cleanup, opportunistic, not blocking:** the 3 pre-existing
   lint errors and 1 pre-existing failing test listed under Baseline above;
   `lib/lookbook/manifest.ts` (a parallel, soon-redundant static registry
   duplicating two `media_assets` rows); 4 orphaned `site_copy` seed keys in
   `lib/db/seed.ts:485-489` that don't match any key in
   `lib/copy/defaults.ts` (`checkout.disclaimer`, `checkout.terms_fan`,
   `checkout.terms_business`, `sponsor.ownership_notice`).

## How to continue this in a fresh session

1. Read this file first.
2. Run `npm run typecheck && npm run lint && npm test && npm run build` to
   confirm you're starting from the same green baseline this batch left.
3. Pick the next unchecked item under "Not done yet," in order unless the
   user says otherwise.
4. Same verification bar as Batch 2: typecheck/lint/build/test all green,
   plus an actual dev-server check (DOM text + JS geometry, not just
   "it compiled") before calling a batch done.
5. Update this file's Work batches section before finishing the turn.
