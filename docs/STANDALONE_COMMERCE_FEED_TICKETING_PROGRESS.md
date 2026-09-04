# Standalone Commerce, Feed & Ticketing — Progress

Continuation source for the shop / moderated brand feed / homepage top-3
supporters / events+ticketing initiative. If a session runs out of context
mid-build, **start here** — read this file fully before touching code, then
pick up at the first unchecked batch. Do not re-plan from scratch; the
architecture plan this executes lives at the path recorded below.

**Architecture plan**: written and approved this session at
`C:\Users\Osman\.claude\plans\robust-exploring-kernighan.md`. That file has
the full schema proposal, route map, decision table, and slice roadmap.
This file tracks *execution* against it — what's actually built, verified,
and committed, batch by batch — plus corrections the approval added on top
of the original plan (§ below).

**Operating rules for this initiative** (apply to every batch):
- Never write shop/ticket activity into `contributions`, campaign
  `transactions`, `ledger_entries`, or anything that feeds a supporter/
  sponsor ranking or campaign total. This is the one invariant that
  overrides every other convenience in this build.
- Money stays integer cents. Business logic never imports Stripe directly
  — only `lib/payments`.
- Every admin mutation: `requireAdmin()` (or `requireAdminRole()`) →
  validate → mutate → `recordAudit()` → `revalidatePath()`.
- All new public-facing surfaces ship behind a feature flag, default off.
  Code-complete is not the same as publicly enabled.
- Generate migrations, review them, **never run `db:migrate`, never push
  to the live database**. Commit locally after each batch; do not push to
  `origin` or deploy without the user's explicit, separate confirmation
  (see the note on the plan-approval contradiction below).

## Corrections applied on top of the original architecture plan

The plan was approved with six specific corrections that supersede what's
written in the plan file where they conflict:

1. **Ticket credentials must be regenerable, not hash-only.** The plan's
   original "store only `tokenHash`, discard the plaintext" design cannot
   support admin resend or QR regeneration once the plaintext is gone.
   Replaced with an **HMAC-signed deterministic credential**: ticket id +
   `credentialVersion` + HMAC(`TICKET_SIGNING_SECRET`), encoded into the
   opaque URL. Verification is constant-time. Reissue increments
   `credentialVersion`, which alone invalidates every previously issued
   credential for that ticket — no separate revocation list needed. See
   Batch H for the actual implementation once it lands.
2. **No inventory reservation on "add to cart."** Reservations are created
   only when server-side checkout actually begins (order created
   atomically with its reservation, short expiry matching the payment
   session). A client cart holds product/variant IDs and quantities only
   — never a price, never a hold on stock.
3. **`product_variants.stockOnHand` is the one authoritative quantity**,
   updated in the same transaction as every `inventory_movements` insert
   — not derived by summing movements at read time. Available stock is
   `stockOnHand - activeUnexpiredReservations`, computed on read.
   Analogous rule for tickets: `capacity - issuedNonVoided -
   activeReservations`, with the ticket-type row locked during
   reservation.
4. **Webhook dispatch resolves the owning domain explicitly**, not by
   trusting `PaymentIntent` metadata alone (some Stripe event types —
   refunds, disputes, charges — don't carry it the same way). A resolver
   checks the provider reference against `transactions` first, then
   `commerce_payments`; ambiguous ownership is a hard error, logged, never
   guessed. `requireTransaction()` is never called before this resolution
   happens.
5. **Admin role enforcement is real, not aspirational.** Added
   `requireAdminRole()` (Batch A, done — see below) and every new
   commerce/feed/ticketing admin action must use it with the specific
   role list from the plan's decision table, not just `requireAdmin()`.
6. **Partial ticket refunds require explicit per-ticket selection** by the
   admin — money and ticket-voiding are never auto-linked for a partial
   refund on a multi-ticket order.

**Note on the plan-approval message itself**: the approval instructions
said "do not push or deploy" in well over a dozen places, and then the
final-report section said "push and deploy when done." Those two
directions conflict. Resolved in favor of the repeated, explicit
restriction — every batch is committed locally; nothing is pushed to
`origin` or deployed without the user separately confirming that when
they're back. Flagged this explicitly rather than guessing which
instruction was the typo.

---

## Batch A — Foundation

### Migration-journal investigation (read this before generating any new migration)

**Finding**: `lib/db/migrations/` has 5 SQL files
(`0000_wise_squadron_supreme`, `0001_wooden_silk_fever`,
`0002_stripe_payment_reconciliation`, `0003_notification_delivery`,
`0012_phase_7_integrity`), but `meta/_journal.json` — drizzle-kit's own
record of what's been generated — only lists `0000` and `0001`. Migrations
`0002`, `0003`, and `0012` exist as reviewed SQL on disk with **no
corresponding `meta/000X_snapshot.json` and no journal entry**.

**Why this matters**: `drizzle-kit generate` diffs the *current*
`lib/db/schema/*.ts` against drizzle-kit's *last known snapshot*
(`0001`'s), not against the real database. Since `0002`/`0003`/`0012`
aren't in that snapshot lineage, generating a new migration today would
very likely try to re-emit their changes (e.g. `ADD COLUMN dedupe_key`)
as if they'd never happened — which would fail if applied to a database
where those columns already exist.

**Evidence gathered, no live DB access used**: all three orphaned
migrations were read in full. Every statement in every one of them uses
`ADD COLUMN IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` / a `DO $$ ... IF
NOT EXISTS ... $$` guard for constraints — they were **hand-authored to be
idempotent**, not drizzle-kit's raw default output. Cross-checked against
the current `lib/db/schema/*.ts`: every column and constraint those three
files add (`refunds.status`/`failureReason`/`updatedAt`,
`ledger_entries.refundId`/`externalRef`, `disputes.providerRef`,
`notifications.dedupeKey`/`deliveryStatus`/`attemptCount`/etc.,
`transactions_provider_ref_unique_idx`, the `contributions.referral_link`
FK) is already present in the current schema and is actively depended on
by live application code (`lib/ledger/contributions.ts`,
`lib/notifications/outbox.ts`). Since this session verified the deployed
site's checkout/homepage/song pages working correctly against the real
production database earlier in this project, and that code path would
fail immediately without those columns existing, **the evidence strongly
supports that `0002`/`0003`/`0012` are already applied in production** —
but this was not verified by directly querying the live database, because
this session does not have (and was explicitly asked not to obtain)
production database credentials.

**Resolution adopted** (matches the "if production state cannot be
verified, document the required manual check and continue with additive,
non-rewriting migrations" instruction):
- Did **not** hand-craft replacement `meta/000X_snapshot.json` files —
  guessing at drizzle-kit's internal snapshot format without a live DB to
  validate against is exactly the kind of guess this instruction says not
  to make.
- Did **not** modify `0000`/`0001`/`0002`/`0003`/`0012` themselves.
- **Adopted the defensive-SQL style those three files already established
  as this project's real (if implicit) convention for every migration
  this initiative generates going forward** — every new `ALTER
  TABLE`/`CREATE INDEX`/`ADD CONSTRAINT` in this initiative's migrations
  will use the same `IF NOT EXISTS`/`DO $$ IF NOT EXISTS $$` guards,
  regardless of what `drizzle-kit generate` emits by default. This makes
  the historical journal gap irrelevant going forward — every new
  migration this initiative writes is safe to run against a database
  whether or not some earlier step already happened.
- **Manual verification required from the user before any of this
  initiative's migrations are applied to production**: confirm directly
  against the live Neon database (e.g. `\d refunds`, `\d notifications` in
  `psql`, or the Neon console's table browser) that `refunds.status`,
  `notifications.dedupe_key`, `ledger_entries.external_ref`,
  `disputes.provider_ref`, and the `transactions_provider_ref_unique_idx`
  index already exist. If they do (expected), no action needed — new
  migrations will simply no-op on those specific statements. If they
  don't, stop and reconcile before applying anything new from this
  initiative, since that would mean production is running without
  invariants the current application code assumes.

### Centralized admin role authorization — done

`requireAdmin()` (`lib/admin/guard.ts`) previously checked only "is this a
logged-in, active admin" — every admin who could log in had full access
regardless of `adminRole`. Added:

```ts
export type AdminRole = AdminIdentity['role'];
export class AdminAuthorizationError extends Error { ... }
export async function requireAdminRole(allowed: AdminRole[]): Promise<AdminIdentity>
```

`super_admin` is always allowed regardless of the `allowed` list (matches
what that role means everywhere else it's referenced). Every new
commerce/feed/ticketing admin action in this initiative must call
`requireAdminRole([...])` with the specific roles from the plan's decision
table (§16 of the architecture plan), not the bare `requireAdmin()` the
rest of the codebase still uses for its own existing, lower-stakes
domains. Existing admin code is untouched — this is additive.

### Feature-flag admin management — done

No admin UI to toggle `feature_flags` existed before this batch (confirmed
by full-repo search during planning — only `lib/db/seed.ts` wrote rows).
Added, mirroring the existing `/admin/settings` generic key/value pattern
exactly:
- `lib/admin/queries.ts`: `listFeatureFlags()`.
- `lib/admin/flag-actions.ts`: `saveFeatureFlag()` / `deleteFeatureFlag()`
  — **`requireAdminRole([])`, i.e. super_admin only**, per the decision
  table ("feature-flag administration requires super_admin").
- `components/admin/FlagRow.tsx` — same shape as `SettingRow.tsx`
  (key/description/enabled + save, plus an "add new" row).
- `app/admin/(dash)/flags/page.tsx` — redirects non-super-admins to
  `/admin` rather than throwing a raw error (page-level authorization
  wrapper around `requireAdminRole`).
- Nav entry added to `app/admin/(dash)/layout.tsx`.
- `lib/copy/admin.ts`: `admin.nav.flags`, `admin.flags.*`.

Seeded (in `lib/db/seed.ts`, a **local dev-only script — not run against
production by this session**) the flag keys this initiative will use, all
`enabled: false`: `shopEnabled`, `brandFeedEnabled`,
`brandSubmissionsEnabled`, `eventsEnabled`, `ticketSalesEnabled`,
`ticketCheckInEnabled`, `homeFeedPreviewEnabled`, `homeShopPreviewEnabled`.
**These rows do not exist in production yet** — `flagEnabled(key)`
already defaults to `false` for any key with no row, so nothing is exposed
either way; an admin creates the real row via `/admin/flags` (or the seed
script, for local dev) when a batch is ready to be toggled on. Homepage
top-3 supporters (Batch B) deliberately has **no flag** — it's a small,
verified widening of an already-public feature (one more leaderboard row),
not new surface area, so gating it behind a flag would be process
overhead without a real safety benefit. Flagged here in case that
judgment call needs revisiting.

### Verification
`npm run typecheck && npm run lint && npm run build` — all clean, same 3
pre-existing lint errors as baseline (unrelated files, not touched by this
batch), no new errors. `npm test` — 149 passing, same 1 pre-existing
failing suite (`tests/referral-attribution.test.ts`, a `server-only`
import issue unrelated to this work) as baseline. No regressions.

### Commit
See git log — commit message `Prepare standalone commerce and moderation foundation`.

---

## Batch B — Homepage top-three supporters

Status: **done**.

- `lib/config/defaults.ts`: `homeSupportersPreviewCount: 3` (new setting,
  admin-overridable via `/admin/settings` like every other `setting()`
  key — no new admin UI needed).
- `lib/home/queries.ts`: `HomeComposition.topFan` (singular) →
  `topFans: LeaderboardRowData[]`. The fan-side `getLeaderboard(...)` call
  now passes `homeSupportersPreviewCount` instead of a hard-coded `1`.
  **Top sponsor is unchanged** — still `getLeaderboard(campaignId,
  'business', 1)`, per the approved correction (§2.6: only the fan query
  changes). No global fallback: `topFans` is `[]` whenever
  `resolveFeaturedCampaign()` returns `null` (unset/ineligible configured
  campaign), never silently pulled from anywhere else.
- New `components/home/TopSupportersPreview.tsx` — reuses
  `components/primitives/LeaderboardRow.tsx` (the same ranked-row
  primitive the song page's full leaderboard already uses: medal icons
  for 1st/2nd/3rd, avatar, tabular amount) instead of building a second
  near-identical "top fan" widget. `row.slug` is already `null` for
  anonymous/unapproved supporters (computed server-side in
  `lib/campaign/queries.ts`'s `standingsFor()`), so linking straight off
  it can never expose a profile link that shouldn't be public — no new
  privacy logic needed, just correct reuse of what already exists.
- `components/home/FeaturedCampaign.tsx`: `topFan` prop → `topFans`,
  renders `<TopSupportersPreview>` instead of a single `<CampaignLeader>`
  for the fan slot; sponsor slot (`<CampaignLeader icon={Crown} featured
  logo>`) is byte-for-byte unchanged.
- `lib/copy/defaults.ts`: `'home.top_fan_heading'` fallback text changed
  from `'TOP FAN SUPPORTER'` to `'TOP SUPPORTERS'` (same key, no new copy
  key needed — this key had no DB override anywhere yet, so repointing its
  default text is safe).
- Deleted `components/home/SpotlightRow.tsx` — re-confirmed
  repo-wide-unused (only match was the file itself) immediately before
  deleting, per the batch instruction to verify, not assume, before
  removing it.
- `app/styles/home.css`: `.home-top-supporters-list` (vertical stack,
  zeroes out `LeaderboardRow`'s own horizontal padding so it sits flush
  inside the existing `.home-campaign-leader` card).

**No feature flag** — this widens an already-public feature (one more
leaderboard row on a page that's already live) rather than exposing new
surface area, so gating it felt like process overhead without a real
safety benefit. Flagged in case that judgment call needs revisiting.

**No new test file** — the invariants this batch touches (settled-only,
anonymity, hidden-amount, moderation, refund/dispute handling via
negative ledger entries) all live inside `getLeaderboard()`, which this
batch does not modify — only the `limit` argument passed to it changes,
from a literal `1` to a setting-driven value. Those invariants are
already covered by the existing `ranking.test.ts` and `privacy.test.ts`
suites. The only genuinely new code here is presentational (the wrapper
component + CSS), which is why verification leaned on live rendering
rather than a new unit test file.

**Verification**: typecheck/lint/build/test all clean, same baseline as
Batch A, no new issues. Live-checked in the dev server: the zero-fans
case (no featured campaign currently configured in this dev DB → the
existing "Nothing is currently building" empty state) renders cleanly,
no console errors, no crash. **Could not visually confirm the actual
3-row rendering against live data** — the only campaign in this
database's current dev/prod state with real fan contributions
("CAN'T READ YOUR MIND", 5 real backers including one anonymous) is not
the currently-configured featured campaign, and changing
`homeFeaturedCampaignId` to point at it would be a production settings
mutation this session was told not to make unilaterally. **Manual
follow-up for the user**: to see the top-3 list rendered against real
data, temporarily set `homeFeaturedCampaignId` to `cant-read-your-mind`'s
campaign id via `/admin/settings` and view the homepage — expect 3 ranked
rows (Marcus $1,250, jasmine.reyes $825, KDot_ATL $600), with the 4th/5th
real backers (darius__ $500, an anonymous $500) correctly excluded by the
`limit: 3`, and the anonymous-handling/hidden-amount paths can be
spot-checked once a supporter using those options is among the top 3 for
whichever campaign is actually featured at the time.

## Batch C — Moderated feed foundation

Status: **done**.

### Schema and migration
- `lib/db/schema/feed.ts`: `brand_feed_posts` table (fields match the
  architecture plan's §4 exactly — see that file for the full column
  rationale). Barrel-exported from `lib/db/schema/index.ts`.
  `relatedLiveEventId` is deliberately **not** a column yet — `live_events`
  doesn't exist until Batch F; add it as a real nullable FK then, not a
  bare uuid now.
- **Migration generation hit the journal-gap problem documented in Batch A
  in a very concrete way**: `npm run db:generate` produced a file it
  numbered `0002_clammy_cyclops.sql` — colliding with the existing
  hand-authored `0002_stripe_payment_reconciliation.sql` — and bundled my
  new table together with a raw (non-idempotent) re-emission of columns
  already added by 0002/0003/0012, **plus two more previously-undocumented
  drift items this generate run surfaced**: `analytics_events.event_key`
  (+ its unique index) and a `badge_grants` unique index, neither of which
  appeared in the three known orphaned migrations. Did not adopt any of
  that raw output. Instead:
  1. Reverted `meta/_journal.json` back to its prior 0000/0001-only state
     and deleted the auto-generated `meta/0002_snapshot.json` — not
     adopting drizzle-kit's bookkeeping for this run.
  2. Hand-extracted only the `brand_feed_posts` statements into
     `lib/db/migrations/0013_brand_feed_posts.sql` (numbered after the
     highest existing file, not the colliding `0002` drizzle-kit chose),
     with every statement `IF NOT EXISTS`-guarded to match 0002/0003/0012's
     established idempotent style.
  3. **Did not touch** the unrelated drift (`analytics_events.event_key`,
     `badge_grants` unique index) — bundling pre-existing, unrelated drift
     into a migration named "add brand feed posts" would misattribute it.
     Flagging it here for the user's own separate, dedicated reconciliation
     migration: `analytics_events` needs an `event_key text` column plus a
     unique index on it, and `badge_grants` needs a unique index on
     `(badge_id, supporter_id, campaign_id)` — both already exist in the
     live application schema/code (confirmed via `getTableColumns`-driven
     typecheck passing against real query code that reads them) but appear
     to have never been captured in any committed migration file at all,
     unlike 0002/0003/0012 which at least exist as hand-authored SQL.
  4. **Migration is generated and reviewed, not applied** — `db:migrate`
     was never run.

### Application code
- `lib/feed/sanitize.ts` — `normalizeExternalUrl()`: https-only allowlist,
  rejects everything else outright (no attempt to "clean up" an unsafe
  URL into something that looks safe).
- `lib/feed/visibility.ts` — `isPubliclyVisible(post, sponsor, now)`, a
  pure function that is the readable spec for the same rule
  `lib/feed/queries.ts`'s `publiclyVisibleWhere()` enforces in SQL (both
  files cross-reference each other in comments so they don't silently
  drift apart). Tested directly in `tests/feed-visibility.test.ts` (13
  cases: every moderation state × sponsor-approval combination, scheduled-
  future, just-published-now boundary, expiry boundary, never-published).
  This is the batch's answer to "tests for every moderation/scheduling/
  expiration combination" — via a pure decision function per this repo's
  established testing convention, not a DB integration test.
- `lib/feed/queries.ts` — public reads (`listPublicFeedPosts` with real
  keyset/cursor pagination using Postgres row-value comparison, not a
  fake cursor param that was accepted but never applied to the WHERE
  clause — caught and fixed that exact bug while writing this file, see
  below; `getPublicFeedPost`, `getLatestPublicFeedPosts` for the future
  homepage preview) and admin reads (`listAdminFeedPosts`,
  `getAdminFeedPost`, `listApprovedSponsorsForSelect`). Both public
  queries double-gate on `brandFeedPosts.moderation` AND
  `sponsors.moderation`, matching `lib/sponsor/queries.ts`'s
  `getSponsorProfile()` precedent.
- `lib/feed/admin-actions.ts` — `createFeedPost`/`updateFeedPost`
  (`content_admin`), `approveFeedPost`/`rejectFeedPost`/`hideFeedPost`/
  `unpublishFeedPost` (`content_admin` + `partnership_admin` +
  `moderator` — see the role-split note below). Every mutation:
  `requireAdminRole()` → validate → `dbw` write → `recordAudit()` →
  `revalidatePath()`. `updateFeedPost` snapshots a brand-submitted post's
  original content into `originalSubmission` the *first* time it's
  edited, never again — matching the plan's "preserve the original
  submission separately from later admin edits" requirement, ready for
  Batch D even though nothing produces `submissionSource: 'brand_invite'`
  posts yet.
- `app/feed/page.tsx`, `app/feed/[slug]/page.tsx` — public routes,
  `flagEnabled('brandFeedEnabled')`-gated via `notFound()` when off.
  `components/feed/FeedPostCard.tsx` for the grid.
- `app/admin/(dash)/feed/page.tsx` (list), `.../feed/new/page.tsx`
  (create), `.../feed/[id]/page.tsx` (review — sponsor context panel,
  original-submission diff viewer, moderation actions, edit form).
  `components/admin/FeedPostForm.tsx`, `components/admin/
  FeedModerationPanel.tsx`. Nav entry added to `app/admin/(dash)/layout.tsx`.
- Copy: `lib/copy/defaults.ts` (`feed.*`, `home.feed_heading`/
  `home.feed_cta` — the latter two unused until Batch E, added now so
  Batch E doesn't need to touch this file again) and `lib/copy/admin.ts`
  (`admin.nav.feed`, `admin.feed.*`).
- **No nav entry on the public site yet** — deliberately deferred to
  Batch E per the plan's own slice boundary.

### Role-split decision (recorded, not asked twice)
The approved role table said "partnership_admin: brand-feed moderation"
and separately "moderator: feed moderation," without fully resolving
whether *authoring* post content is a third, narrower permission.
Decided: `content_admin` writes/edits post copy (matches "content_admin:
...public feed content" in the same table); moderation actions
(approve/reject/hide/unpublish) are allowed to `content_admin` +
`partnership_admin` + `moderator` together — the broadest reasonable
reading that honors both explicit mentions, plus letting whoever authored
a post also unpublish their own mistake. `super_admin` is always allowed
on top of all of this (built into `requireAdminRole` itself).

### Real bugs caught and fixed while building this (not shipped, then found)
1. `db.select({ ...s.brandFeedPosts, ... })` — spreading a Drizzle table
   object directly into a select projection isn't valid column selection
   (it spreads the table's internal metadata, not actual columns).
   Fixed with `getTableColumns(s.brandFeedPosts)`, matching the pattern
   already used in `lib/partners/queries.ts`.
2. The post's own attached media and the sponsor's logo were both wired
   to the *same* `mediaAssets` join in the admin query, so
   `sponsorLogoPath` was silently just a duplicate of the post's media —
   not the sponsor's logo at all. Fixed with a proper `alias()`'d second
   join (`sponsorLogoAsset`) and two distinct output fields
   (`sponsorLogoPath` vs `postMediaPath`).
3. `listPublicFeedPosts` accepted a `cursor` parameter and declared
   cursor-based pagination in its docstring, but the query never actually
   applied it to the `WHERE` clause — every "next page" request would
   have silently returned the same first page forever. Fixed with a real
   Postgres row-value comparison (`(sort_priority, published_at, id) <
   (...)`) matching the `ORDER BY` exactly. The public `/feed` page had
   the same shape of bug one level up — a "load more" link pointing at
   `?cursor=...` that the page component never read back out of
   `searchParams`. Both fixed together.
4. `app/feed/page.tsx` used a static `export const metadata` instead of a
   flag-aware `generateMetadata()`, so the browser tab title read "The
   Feed | MJ COBE" even while the page correctly rendered its 404 body
   with the flag off — caught by live-checking the actual tab title in
   the dev server, not just the rendered content. Fixed to match the
   `[slug]` page's already-correct pattern.

### Verification
`npm run typecheck && npm run lint && npm run build` — clean, same 3
pre-existing lint errors as baseline, no new ones. `npm test` — 162
passing (149 baseline + 13 new `feed-visibility.test.ts` cases), same 1
pre-existing failing suite. Live-checked in the dev server: `/feed` with
the flag off correctly renders the site's 404 page (verified both the
rendered body text and, after the metadata fix, the tab title);
`/admin/flags` correctly redirects an unauthenticated visitor to
`/admin/login` (confirms the new route is actually gated, not just
assumed to be). **Not verified live**: the admin feed list/review/create
UI and the public feed list/detail rendering with a real approved post —
this session has no admin credentials and was told not to write feed
content into the database itself. Manual follow-up for the user: log
into `/admin`, create a feed post for an approved sponsor via
`/admin/feed/new`, approve it via `/admin/feed/[id]`, then set
`brandFeedEnabled` to `true` on `/admin/flags` and confirm it renders
correctly at `/feed` and `/feed/[slug]` before relying on this batch's
UI further.

## Batch D — Secure brand submissions

Status: **done**.

### Schema and migrations
- `lib/db/schema/feed.ts`: added `brandSubmissionInvites` (sponsor-bound,
  single-use, `tokenHash` only — plaintext token never persisted) and
  `feedSubmissionAttempts` (rate-limit counter, see below). Both
  barrel-exported already via the existing `export * from './feed'`.
- `lib/db/migrations/0014_brand_submission_invites.sql`,
  `lib/db/migrations/0015_feed_submission_attempts.sql` — hand-authored,
  `IF NOT EXISTS`-guarded, same policy as `0013` (see Batch A/C). Generated
  and reviewed, **not applied** — `db:migrate` never run.

### Invite lifecycle (`lib/feed/invites.ts`, `lib/feed/invite-eligibility.ts`)
- `createSubmissionInvite({sponsorId, adminId, expiresInDays})` — 32-byte
  random token (`randomBytes(32).toString('base64url')`, more entropy than
  `lib/checkout/tokens.ts`'s 16-byte share code since this grants *write*
  access), only `sha256(token)` stored. Plaintext returned once, to the
  caller, for embedding in the invite email — never logged, never
  re-derivable afterward.
- `validateSubmissionToken(rawToken)` — looks up by hash, delegates the
  actual usability decision to `isInviteUsable()` (`lib/feed/
  invite-eligibility.ts`), a **pure function** re-checking expiry/revoked/
  used/sponsor-still-approved — extracted specifically so it's unit-testable
  without a DB, per this repo's established convention. Returns a single
  generic "not valid" outcome for every failure reason (unknown, expired,
  revoked, used, sponsor blocked) — deliberately not distinguishing which,
  so a token-guessing attempt can't use the error to narrow its search.
- `markInviteUsed(tx, inviteId, postId)` — conditional `UPDATE ... WHERE
  used_at IS NULL`, called *inside* the same transaction that creates the
  resulting post (`lib/feed/submission-actions.ts`). If two concurrent
  requests redeem the same token, the loser's `UPDATE` matches zero rows
  and its whole transaction (including the post insert) rolls back — this
  is what actually prevents a double-submit from creating two posts, not
  the earlier `validateSubmissionToken` read alone.
- `revokeInvite(inviteId)`.
- `sendSubmissionInviteEmail(...)` — enqueues via the existing
  `notifications` outbox (`dedupeKey: brand_submission_invite:${inviteId}`)
  and calls `deliverNotification()` immediately, matching
  `sendContributionConfirmation()`'s exact shape in `lib/notifications/
  outbox.ts`. `lib/email/templates.ts`'s `siteUrl()` was exported (was
  file-private) so this module could build the absolute submission link.

### Email template
- `lib/email/templates.ts`: `'brand_submission_invite'` notification kind,
  `BrandSubmissionInvitePayload` type, `brandSubmissionInviteEmail()` — a
  real HTML+text template (not just a declared-but-unimplemented kind,
  which was flagged as a repeated failure mode in the architecture plan's
  risk table).

### Admin invite management (`lib/feed/invite-actions.ts`, `/admin/feed/invites`)
- `issueSubmissionInvite` / `revokeSubmissionInvite` /
  `resendSubmissionInvite` — all `requireAdminRole(['partnership_admin'])`
  (issuing a sponsor relationship credential is a partnership decision,
  scoped separately from Batch C's `MODERATION_ROLES`). Issuing requires
  the sponsor to currently be `moderation: 'approved'` — rejected
  otherwise, both for a first issue and for resend. Resend never reuses
  the old token (it was never stored): it revokes the superseded invite
  and issues + emails a fresh one to the same sponsor.
- `lib/feed/queries.ts`: `listAdminSubmissionInvites()` — resolves
  `status`/`usable` **server-side at fetch time**, not in the client row
  component, because a React render body must stay pure (no `Date.now()`
  calls) — this was caught by the React Compiler's purity lint (see Real
  bugs below), not just a style preference.
- `components/admin/InviteIssueForm.tsx`, `components/admin/InviteRow.tsx`
  — same `useActionState` + hidden-field-form pattern as
  `FeedModerationPanel.tsx`.

### Public submission route (`/partners/submit/[secureToken]`)
- `app/partners/submit/[secureToken]/page.tsx` — flag-gated
  (`brandSubmissionsEnabled`) via `notFound()`; invalid/expired/revoked/
  used token renders one generic "this link isn't valid" state (server
  component reads the token server-side, never exposes which specific
  reason). `robots: noindex` — this is a private, single-use link, not a
  page meant to be discoverable.
- `components/feed/SubmissionForm.tsx` — client form, `postType` limited
  to **text/image/link only** (no video — see media module note below),
  honeypot field (`company_website_confirm`, same name/pattern as
  `lib/checkout/actions.ts`, CSS-hidden not JS-hidden so it still exists in
  the DOM for bots that don't render styles), required rights-attestation
  checkbox.
- `lib/feed/submission-actions.ts` — `submitBrandFeedPost` server action:
  honeypot check → rate-limit check → token validation → rate-limit check
  again (per-invite) → field validation (postType allowlist, `ctaUrl`
  through the existing `normalizeExternalUrl()`, media through the new
  validation module) → transaction (insert post with
  `sponsorId: invite.sponsorId` + `markInviteUsed`). **The sponsor identity
  is never read from form input anywhere in this file** — there is no
  `sponsorId` field on the form at all, so there's no code path through
  which a submission could be attributed to a sponsor other than the one
  the admin bound the invite to at issuance. This is what the plan's
  "sponsor impersonation" test requirement is actually about; documented
  (not faked with a mock) in `tests/feed-invites.test.ts`'s trailing
  comment.

### Rate limiting (deliverable: "honeypot and rate limiting")
- `feed_submission_attempts` table: one row per POST attempt (success,
  validation failure, or invalid token), written before most other work.
  `submitBrandFeedPost` rejects (without revealing which check failed) once
  either the requesting IP or the specific invite has **5 attempts within
  a rolling 10-minute window**. The invite token's own 256-bit entropy
  already makes brute-force guessing computationally infeasible — this
  table isn't defending the token's secrecy, it caps how many times a
  given invite or IP can hammer the endpoint, matching the plan's "small
  counter keyed by token or IP with a time window" guidance without adding
  an external dependency (no Redis/Upstash).

### Media upload (`lib/feed/media-validation.ts`, `lib/feed/media.ts`)
- Split into two files specifically so the signature/size/type validation
  logic is unit-testable without pulling in `'server-only'` + Vercel Blob +
  the DB: `media-validation.ts` has no side-effecting imports at all;
  `media.ts` re-exports it and adds `storeFeedMedia()` (Blob upload +
  `media_assets` insert with `role: 'feed-pending'`, `kind: 'image'` — the
  latter matters: `media_assets.kind` is a Postgres enum
  (`image|video|audio|logo`), not free text; an early draft of this module
  used `kind: 'feed-media'`, which would have failed the DB constraint —
  caught and fixed before it was ever exercised against a real database,
  see Real bugs below).
- Adapted from `lib/media/sponsor-logo.ts`'s magic-byte-sniffing pattern
  (PNG/WebP signatures) plus a third format, JPEG (`FF D8 FF`), matching
  what brand submissions realistically need. 5MB cap.
- **Video is explicitly not supported** — no transcoding/streaming
  infrastructure, no player component, no moderation tooling for scanning
  video before it's public. Both the admin `FeedPostForm` and the public
  submission form only offer **text/image/link** as selectable post types
  (removed 'video' as an option from `FeedPostForm`'s existing select,
  which had offered it since Batch C with no actual storage path behind
  it). Documented in `lib/feed/media.ts`'s header comment as the
  plan-sanctioned escape hatch ("keep video disabled by capability/
  configuration, document the exact blocker") rather than half-building it.
- Wired into `FeedPostForm.tsx` (a Batch C gap: the admin form never had a
  media upload control despite the schema supporting `mediaAssetId` since
  it was created) — uploading a new file replaces a post's media; leaving
  it empty on an edit **keeps** the existing media rather than clearing it
  (`lib/feed/admin-actions.ts`'s `updateFeedPost` falls back to
  `before.mediaAssetId` when the form's media field was empty).

### Real bugs caught and fixed while building this (not shipped, then found)
1. `storeFeedMedia` initially inserted `media_assets.kind: 'feed-media'` —
   `kind` is a Postgres enum (`image|video|audio|logo`), not free text.
   Would have thrown a DB constraint error on the very first real upload.
   Fixed to `kind: 'image'` before this was ever exercised against a
   database, by re-checking the schema definition rather than assuming a
   string column.
2. `components/admin/InviteRow.tsx` originally computed "is this invite
   still usable" (and its status label) by calling `Date.now()` directly
   inside the component's render body. The React Compiler's purity lint
   (`react-hooks/purity`) correctly flagged this as an impure render — a
   component render should not depend on wall-clock time evaluated at
   render, since re-renders can then produce different output for
   identical props. Fixed by moving the status/usability computation into
   `lib/feed/queries.ts`'s `listAdminSubmissionInvites()` (plain
   server-side function, resolved once when the list is fetched) and
   passing the already-resolved `status`/`usable` fields down as props
   instead of recomputing them in the client component.
3. `markInviteUsed`'s conditional-`UPDATE`-inside-the-post-creation-
   transaction design (rather than checking-then-writing as two separate
   steps) was deliberate from the start, not a bug found after the fact —
   noted here because it's the one piece of this batch that's actually
   concurrency-sensitive (a double-submit race on the same token) and is
   worth a future session double-checking with a real concurrent-request
   test before this route sees real traffic, the same way Batch H's ticket
   redemption is required to.

### Verification
`npm run typecheck && npm run lint && npm run build` — all clean; lint run
scoped to this batch's own files (`lib/feed/**`, the new components, the
new routes) shows zero errors/warnings, and a full-repo lint run shows the
same 4 pre-existing errors as baseline (confirmed via `git status` that
none of those 3 files were touched this session) plus the fix for the one
error this batch's own code introduced (#2 above, now fixed — full-repo
lint is back to exactly the pre-existing baseline). `npm test` — 185
passing (162 baseline + 23 new: `tests/feed-invites.test.ts` for
`isInviteUsable()` including the impersonation-prevention note,
`tests/feed-media.test.ts` for signature/type/size validation including a
mismatched-declared-type attack case, `tests/feed-sanitize.test.ts` for
`normalizeExternalUrl()`), same 1 pre-existing failing suite
(`tests/referral-attribution.test.ts`, untouched, `server-only` import
issue unrelated to this work). `npm run build` — succeeds, all new routes
present in the route manifest (`/admin/feed/invites`,
`/partners/submit/[secureToken]`).

**Not verified live** (no admin credentials, no live DB writes made by
this session): issuing a real invite, receiving/opening the actual email,
completing a real submission end-to-end, and confirming a submitted post
shows up correctly in `/admin/feed/[id]`'s review UI with its
`originalSubmission` snapshot populated after a subsequent admin edit.
**Manual follow-up for the user**: enable `brandSubmissionsEnabled` on
`/admin/flags`, issue an invite to a real approved sponsor from
`/admin/feed/invites`, and walk the full path once — including trying to
reuse the same submission link a second time (should show the generic
"not valid" state) and trying an obviously-fake token (should show the
same generic state, not a different one).

## Batch E — Feed navigation and homepage preview

Status: **done**.

- `lib/config/defaults.ts`: `homeFeedPreviewCount: 3` (new setting, same
  admin-overridable pattern as `homeSupportersPreviewCount`).
- `lib/copy/defaults.ts`: `nav.feed` (`'THE FEED'`). `home.feed_heading`/
  `home.feed_cta` were already reserved in Batch C.
- `components/SiteNav.tsx`: the `/feed` link is appended to the shared
  `links` array **only when `flagEnabled('brandFeedEnabled')` is true** —
  a nav link to a route that 404s with the flag off would be a broken
  link, not a hidden feature. `MobileNavToggle` already maps over the same
  array, so this covers both desktop and mobile nav with one change, no
  separate mobile wiring needed.
- `components/SiteFooter.tsx`: same flag-gated link added to the footer
  nav row.
- `lib/home/queries.ts`: `HomeComposition.latestFeedPosts: PublicFeedPost[]`
  — **not queried at all when the flag is off** (checked before calling
  `getLatestPublicFeedPosts()`, not just hidden at render time after an
  unconditional fetch).
- `components/home/FeedPreview.tsx` — new, mirrors `PartnerStrip.tsx`'s
  section shape exactly (heading + "view the feed" link + content row),
  reuses `FeedPostCard.tsx` from Batch C directly rather than a second
  card component. Returns `null` when there are zero posts — never
  fabricates placeholder content to fill the row, same contract as
  `PartnerStrip`. **Static responsive grid, not a carousel**, per the
  explicit instruction to avoid carousel accessibility/overflow risk
  unless proven necessary.
- `app/page.tsx`: `<FeedPreview>` wired in between `JourneySpotlight` and
  `PartnerStrip`.
- `app/styles/home.css`: `.home-feed-preview` section spacing, reusing the
  existing `.home-partner-strip-heading`/`-view-all` classes rather than
  duplicating them.

### Verification
`npm run typecheck && npm run lint && npm run build` — clean; lint scoped
to this batch's files shows zero errors/warnings, full-repo lint shows the
same pre-existing baseline as Batch D (nothing new). `npm test` — 185
passing, same 1 pre-existing failing suite (unrelated, untouched). `npm
run build` — succeeds. **Live-checked in the dev server** with the flag
at its real default (off): homepage renders with no "THE FEED" nav link,
no "FROM OUR PARTNERS" feed preview section, no console errors beyond the
already-known-cosmetic HMR websocket noise; `/feed` still correctly
renders the site's 404 page. **Not verified live**: the populated state
(nav link present, preview grid rendering real approved posts) — same
constraint as Batch C, no admin credentials and no live content to enable
the flag against. Manual follow-up folds into the one already logged for
Batch D: once a real submission exists and is approved, also confirm the
homepage preview row and nav/footer links render correctly with
`brandFeedEnabled` on.

## Batch F — Events and Journey integration

Status: **done**.

### Schema and migration
- `lib/db/schema/enums.ts`: `eventStatus` enum (`scheduled | postponed |
  canceled | completed`).
- `lib/db/schema/events.ts` (new): `liveEvents` (slug/venue/address/
  dates/timezone/sales-window/status/`ticketingEnabled`/informational
  `capacity`) and `ticketTypes` (name/price/capacity/perOrderLimit/sales
  window/active/sort — pricing-and-capacity plan only, nothing sells
  against these yet). Barrel-exported via `lib/db/schema/index.ts`.
- `lib/db/schema/content.ts`: `journey_events.liveEventId` — a real typed
  nullable FK (`onDelete: set null`), following the exact precedent
  `songId`/`campaignId` already set on this table rather than a generic
  polymorphic pointer.
- `lib/db/migrations/0016_live_events.sql` (new) — hand-authored,
  `IF NOT EXISTS`-guarded, same policy as 0013–0015. Creates the
  `event_status` enum, `live_events`, `ticket_types`, adds
  `journey_events.live_event_id`, and adds real Postgres `CHECK`
  constraints (`live_events.capacity >= 0` when set,
  `ticket_types.capacity >= 0`) — the first `CHECK` constraints added by
  this initiative; no existing Drizzle schema file in this repo uses
  `.check()`, so these live only in the hand-authored SQL, not the TS
  schema. Generated and reviewed, **not applied** — `db:migrate` never run.

### A real regression caught by `npm run build`, not a live check
`getGlobalJourney()` (`lib/journey/queries.ts`) is an **existing, always-on
query** — it backs both the homepage's journey spotlight and the public
`/journey` page, neither of which is flag-gated. Adding an unconditional
`leftJoin(s.liveEvents, ...)` to it broke `npm run build` outright:
`relation "live_events" does not exist`, because the migration that
creates that table is generated but deliberately never applied (this
initiative's standing policy). A first fix attempt only neutered the
join's `ON` condition to `sql\`false\`` — that still failed, because
`.leftJoin(s.liveEvents, ...)` emits `LEFT JOIN "live_events" ...` in the
compiled SQL regardless of what the `ON` clause says; the join *target*,
not just its condition, has to be conditional. The actual fix: two
separate query bodies inside `getGlobalJourney()`, branching on
`flagEnabled('eventsEnabled')` — when off, the function runs byte-for-byte
the same query this table already ran before this batch; when on, it runs
the new query with the `live_events` join. This is the same principle
every earlier batch's new tables already followed (only ever reached
through a flag-gated route), just the first time it had to be applied
*inside* a pre-existing shared query function instead of a brand-new one.
Caught by running `npm run build` against the real dev database as part
of this batch's own verification sweep — not something a typecheck, lint,
or unit test would have surfaced, since the query is syntactically valid
TypeScript either way.

### Application code
- `lib/events/eligibility.ts` — `resolveEventCtaState(event, now)`, a pure
  function (`unpublished | canceled | postponed | completed |
  ticketing_disabled | not_yet_on_sale | on_sale | sales_closed`), tested
  directly in `tests/events-eligibility.test.ts` (12 cases: every
  lifecycle-status short-circuit, both sales-window boundaries, the
  ticketing-disabled path, and confirming lifecycle status is checked
  before the sales window so a canceled event never reads as on_sale even
  with an open sales window). **Deliberately no `sold_out` state** — no
  order/reservation/ticket table exists yet (Batch G/H), so this batch
  cannot know how many tickets have actually been claimed; sold-out
  detection belongs here as an additional input once issuance exists, not
  bolted on elsewhere.
- `lib/events/queries.ts` — public reads (`listUpcomingEvents`,
  `listPastEvents`, `getPublicEvent`, each attaching active ticket types
  via a single `inArray`-scoped query, not one query per event) and admin
  reads (`listAdminEvents`, `getAdminEvent`). `formatEventDateTime()`
  renders in the **event's own venue timezone** (`Intl.DateTimeFormat`
  with the event's stored IANA zone), not the site's global
  `displayTimeZone` setting — a visitor reading "8:00 PM" for a Nashville
  show should see Nashville's 8:00 PM regardless of their own browser
  clock; falls back to a zone-less render if an admin-entered timezone
  string isn't valid, rather than throwing on a public page.
- `lib/events/admin-actions.ts` — `createEvent`/`updateEvent`
  (`content_admin`, matching the launch role table's "content_admin: ...
  event content ..." entry) and `createTicketType`/`updateTicketType`/
  `deleteTicketType` (same role). Ticket-type delete is a hard delete for
  now — no order/ticket table references `ticket_types` yet, so nothing
  can dangle; that becomes a soft-delete-only guard once Batch G/H add a
  real reference.
- `app/events/page.tsx`, `app/events/[slug]/page.tsx` —
  `flagEnabled('eventsEnabled')`-gated via `notFound()`. List page splits
  upcoming (soonest first) from past (most recent first) as two separate
  queries/sections, not one mixed feed. Detail page shows the ticket-type
  list as **prices only, no purchase button or link** — Batch F explicitly
  excludes payments, and rather than a placeholder "buy" button that goes
  nowhere, the page states plainly that online purchase is coming soon.
- `components/events/EventCard.tsx` for the list grid.
- `app/admin/(dash)/events/page.tsx` (list), `.../events/new/page.tsx`
  (create), `.../events/[id]/page.tsx` (edit + ticket-type management).
  `components/admin/EventForm.tsx`, `components/admin/
  TicketTypeManager.tsx` (per-row edit/delete forms + an add-new form,
  same `useActionState` + hidden-field pattern as `FeedModerationPanel`/
  `InviteRow`). Nav entry added to `app/admin/(dash)/layout.tsx`.
- **Journey integration**: `lib/journey/queries.ts`'s `JourneyEntry` type
  gained `eventSlug`/`eventTitle` (null unless the referenced event is
  published — same double-gate discipline as the feed, computed in the
  query rather than trusted from a join that could return a draft event's
  slug). `components/home/JourneySpotlight.tsx` and `app/journey/page.tsx`
  both extend their existing `entry.songSlug ? <Link>… : title` ternary
  with an `entry.eventSlug ? <Link>…` branch in between, exactly the
  extension point the architecture plan called out by file name.
- Copy: `lib/copy/defaults.ts` (`events.*`, including one label per CTA
  state) and `lib/copy/admin.ts` (`admin.nav.events`, `admin.events.*`
  including `admin.events.ticketTypes.*`).
- **No primary nav entry** — matches the plan's own recommended decision
  (#4 in the decision table): events are primarily discoverable via
  Journey; `/events` exists as a real route but isn't a 7th nav tab.

### Verification
`npm run typecheck && npm run lint && npm run build` — all clean after the
`getGlobalJourney()` fix above; lint scoped to this batch's files shows
zero errors/warnings, full-repo lint matches the pre-existing baseline.
`npm test` — 197 passing (185 baseline + 12 new
`tests/events-eligibility.test.ts` cases), same 1 pre-existing failing
suite (unrelated, untouched). `npm run build` — succeeds against the real
dev database, `/events` and `/events/[slug]` present in the route
manifest. **Live-checked in the dev server** (this batch specifically
needed this, since it touches two already-shipped, always-on pages, not
just new flag-gated ones): homepage renders unchanged with no console
errors; `/journey` renders all real journey entries correctly with the
flag off (confirms the `getGlobalJourney()` fallback path works, not just
compiles); `/events` correctly 404s with `eventsEnabled` off;
`/admin/events` correctly redirects to `/admin/login` unauthenticated.
**Not verified live**: the populated state (a real event with ticket
types rendering on `/events`/`/events/[slug]`, and a journey entry linking
to it) — no admin credentials, no live event data. Manual follow-up for
the user: create an event via `/admin/events/new`, add a ticket type,
publish it, set `eventsEnabled` to `true` on `/admin/flags`, and confirm
`/events` and `/events/[slug]` render correctly — including the
not-yet-on-sale / on-sale / sales-closed / canceled / postponed states by
adjusting the event's sales window and status fields.

## Batch G — Shared commerce and ticket checkout

Status: **done**. This is the batch where real money/webhook surface area
actually landed — read this section fully before touching Batch H or J,
both of which build directly on top of it.

### Schema and migration
- `lib/db/schema/commerce.ts` (new): `commerceOrders`, `commerceOrderItems`,
  `commercePayments`, `commerceRefunds`, `orderAddresses`,
  `inventoryReservations`. Fully separate from `contributions`/
  `transactions`/`refunds`/`ledger_entries` — discriminated by
  `orderType: 'shop' | 'ticket'`, shared by both future domains.
  `commerceOrderItems.referenceId` is a bare uuid (not a `.references()`
  FK), matching the existing cross-schema-file precedent already used for
  `contributions.sponsorId` — avoids an import cycle with `events.ts`
  (Batch F) and the not-yet-built `shop.ts` (Batch I).
- `lib/db/migrations/0017_commerce_orders.sql` (new) — hand-authored,
  `IF NOT EXISTS`-guarded, same policy as 0013–0016. Adds real Postgres
  `CHECK` constraints (`commerce_order_items.quantity > 0`,
  `inventory_reservations.quantity > 0`), matching 0016's precedent of
  putting `CHECK`s only in the SQL, not the Drizzle schema (no `.check()`
  usage exists anywhere else in this codebase). Generated and reviewed,
  **not applied**.

### A second real regression caught by live verification, same class as Batch F's
`app/orders/[secureToken]/page.tsx` is **public and unauthenticated** —
unlike every other new route in this initiative, it's reachable by
anyone, anytime, not gated behind a login or (originally) a feature flag.
Live-checking it against a nonexistent token in the dev server produced a
real 500 (`relation "commerce_orders" does not exist`) — the exact same
root cause as Batch F's `getGlobalJourney()` break, but this time on a
route with no auth gate to accidentally protect it. **Fixed** by gating
the page (and its `generateMetadata`) behind `flagEnabled
('ticketSalesEnabled')` before ever calling `getOrderBySecureToken()` —
semantically correct, not just a workaround: no real order can exist
unless that flag (or, once Batch J ships, `shopEnabled`) was on at
checkout time, so skipping the query when it's off loses nothing.
Re-verified live afterward: a fresh browser tab hitting the same URL
returns 200 with a clean "we couldn't find that order" state and zero
console errors. **This is now the second time this initiative has shipped
a query against a since-migrated-but-unapplied table on an always-
reachable route** — worth an explicit note for whoever picks up Batch H
or J: any new route that isn't behind both a feature flag AND (for admin
routes) `requireAdmin()` must be live-tested against a nonexistent
record/token before being called done, not just typechecked/built.
`/admin/orders` and `/admin/orders/[id]` were also live-tested the same
way — a first check appeared to crash before `requireAdmin()`'s redirect
resolved, but repeated testing showed it consistently redirects to
`/admin/login` correctly (the first result is presumed to have been a
Next.js dev-mode on-demand-compilation race, not a real gap — but this is
called out explicitly rather than silently assumed safe, since it wasn't
independently re-derived from framework internals).

### Reservations (`lib/commerce/reservation-decision.ts`, `lib/commerce/reservations.ts`)
- `reservationDecision()` — pure oversell-prevention math, split into its
  own file with zero side-effecting imports (same reason as Batch D's
  `lib/feed/media-validation.ts` split: the DB-touching file it was
  originally embedded in is marked `'server-only'`, which throws
  immediately when Vitest imports it directly — caught by a failing test
  run, not assumed safe). Tested in `tests/commerce-reservations.test.ts`
  (9 cases: exact-last-unit grant, zero/negative quantity rejection,
  sold-out rejection, and a documented race scenario showing the decision
  function correctly rejects a second request once the first's grant is
  reflected in the snapshot).
- `reserveTicketCapacity()` — advisory-lock-guarded (`hashtext('ticket_type:'
  + id)`), same primitive already proven in `lib/ledger/contributions.ts`
  for supporter-number issuance. `committed` capacity is computed from
  **paid `commerce_order_items`**, not hardcoded to 0 — a real gap caught
  and fixed while writing this, before it was ever exercised: `settleOrder()`
  deletes a reservation once its order pays, so without counting paid
  order items as committed, that capacity would silently become available
  again the instant payment succeeded (a real oversell path, not a
  hypothetical one — no `tickets` table exists yet to be the source of
  truth for "already claimed", so paid order items are the only durable
  record until Batch H mints real ticket rows). `'partially_refunded'`
  orders still count in full toward committed capacity, per this
  initiative's own correction that money and ticket-voiding are never
  auto-linked — only a fully `'refunded'` order releases its seats.
  Reservations expire after 20 minutes; `sweepExpiredReservations()` +
  `app/api/cron/reservations/route.ts` (registered in `vercel.json`,
  every 10 minutes) clean up expired rows as housekeeping — every read
  already filters `expiresAt > now()`, so this isn't load-bearing for
  correctness, only table hygiene.

### Orders (`lib/commerce/orders.ts`)
- `createOrder()` — mirrors `createContribution()`'s idempotent-creation
  shape exactly: client-supplied idempotency key → payload-hash-scoped
  check against the **same** `idempotency_keys` table (new
  `create_commerce_order:` scope prefix, per the plan) → advisory-lock-
  guarded transaction → provider intent → local rows → store idempotency
  result. Reservations are attached to the order inside this same
  transaction (`attachReservationToOrder`), never taken by this function
  itself — reservation must already exist (checkout-time-only, correction
  #2).
- `settleOrder()` — mirrors `settleContribution()`'s idempotent-early-
  return + advisory-lock shape, simplified: commerce checkout always uses
  automatic capture (no sponsorship-style manual-review split), so
  there's no two-phase authorize/capture dance to replicate. Deletes the
  order's reservations inside the same transaction that flips it to
  `'paid'` — atomic, so a reader can never see "reservation gone, order
  not yet paid".
- `refundOrder()` (admin-initiated) / `reconcileOrderRefund()` (webhook-
  driven confirmation) / `flagCommerceOrderDisputed()` (minimal dispute
  handling — flips order status to `'disputed'`, does not attempt
  `lib/ledger/contributions.ts`'s full won/lost/needs-response lifecycle
  modeling; documented as a deliberate scope reduction, not an oversight).
  Per correction #6, a partial refund never auto-voids a ticket — that's
  a separate, explicit admin action against `tickets` rows once Batch H
  exists; `refundOrder()`'s only job is recomputing `commerce_orders.status`
  from net paid-minus-refunded.
- `getOrderBySecureToken()` / `getOrderByPaymentProviderRef()` — reads.

### Domain-aware webhook dispatch (correction #4)
- `lib/payments/payment-ownership.ts` (pure `classifyPaymentOwnership()`,
  same server-only-split reasoning as the reservation math — tested in
  `tests/webhook-domain-resolution.test.ts`, including the "throws on
  ambiguous ownership" case) + `lib/payments/webhook-resolver.ts`
  (`resolvePaymentDomain()`, the DB-touching wrapper).
- `app/api/webhooks/stripe/route.ts` — every `payment_intent.*` handler
  now calls `resolvePaymentDomain()` **first**, before touching either
  table, and dispatches to either the (renamed, otherwise byte-for-byte
  unchanged) `handleContribution*` functions or new `handleCommerceOrder*`
  functions. `requireTransaction()`/`transactionFor()` — the two functions
  the correction specifically named — are now **deleted**, not just
  unused; there is no code path left that could call them before
  resolution. `handleRefund()`/`handleDispute()` resolve domain via the
  refund/dispute's own PaymentIntent reference and route to
  `reconcileOrderRefund()`/`flagCommerceOrderDisputed()` for commerce,
  falling through unchanged to the existing `reconcileRefund()`/
  `reconcileDispute()` for everything else (including an unresolvable
  reference, preserving this route's exact prior hard-fail behavior for
  that case). Every existing contribution-handling branch's actual logic
  is untouched — only reorganized behind the new resolution gate.

### Checkout UI (ticket orders only — shop checkout is Batch J)
- `lib/events/checkout-actions.ts` — `purchaseTickets()`, mirrors
  `submitFanContribution()`'s shape (honeypot → idempotency-key validation
  → server-side re-validation of everything the client sent, including
  re-running `resolveEventCtaState()` so a stale/tampered form can't buy
  through a canceled/postponed/sold-out-window event → reserve → create
  order → Stripe-clientSecret-present branches to Elements handoff,
  otherwise settles synchronously and redirects to `/orders/[secureToken]`).
- `components/commerce/CommerceStripeStep.tsx` — a separate, leaner
  Stripe Elements wrapper from `components/checkout/StripePaymentStep.tsx`,
  not a reuse of it: that component's failure tracking hard-requires a
  `campaignId`/`supportType` for its analytics call, neither of which
  exists for a commerce order.
- `components/events/TicketCheckoutForm.tsx`, `app/events/[slug]/tickets/page.tsx`
  — flag-gated (`eventsEnabled` AND `ticketSalesEnabled`), also checks
  `event.ctaState === 'on_sale'` server-side before rendering the form (a
  direct hit on this URL for a not-yet-on-sale/sold-out/canceled event
  shows an explanatory state, not a broken form). `app/events/[slug]/page.tsx`
  now links to it with a real "Buy Tickets" button exactly when
  `ticketSalesEnabled` is on and the event is actually on sale — replacing
  the Batch F placeholder text in that one case only.
- `app/orders/[secureToken]/page.tsx` — shared confirmation page for
  shop AND ticket orders (only ticket orders can exist so far). See the
  regression note above for its flag gate.

### Admin surfaces
- `lib/commerce/admin-queries.ts` (`listAdminOrders`, `getAdminOrder`),
  `lib/commerce/admin-actions.ts` (`issueOrderRefund`, `requireAdminRole
  (['finance_admin'])` per the launch role table's "finance_admin:
  refunds/order details/fulfillment"). `app/admin/(dash)/orders/page.tsx`
  (list, filterable by type once there's more than one), `.../orders/[id]/page.tsx`
  (items/payments/refunds + `OrderRefundForm` shown only when a settled
  payment exists to refund). Nav entry added to
  `app/admin/(dash)/layout.tsx`.

### Regression test: campaign isolation
`tests/commerce-campaign-isolation.test.ts` — the single most important
test in this batch, per the plan's own framing. A DB-integration test
proving campaign totals/leaderboards are unaffected by a real commerce
purchase would need live database access this session doesn't have (every
other test in this repo is a pure-function test for the same reason).
Instead: it reads the actual committed source of `lib/commerce/orders.ts`
and `lib/commerce/reservations.ts` and asserts neither file's text
contains `s.contributions`, `s.transactions`, `s.refunds`,
`s.ledgerEntries`, `s.disputes`, `s.consentRecords`, or
`s.supporterNumbers` — the Drizzle identifiers for every campaign-money
table. If a future change ever adds one of those references to either
file, this test fails immediately rather than silently shipping a
campaign-money leak. Not a substitute for a real DB-level regression test
once this session (or a future one) has live database access — flagged
as a manual follow-up below.

### Verification
`npm run typecheck && npm run lint && npm run build` — all clean; lint
scoped to this batch's files shows zero errors/warnings, full-repo lint
matches the pre-existing baseline. `npm test` — 224 passing (211 baseline
+ 13 new: 9 reservation-decision cases, 4 webhook-ownership cases — the
campaign-isolation test file's cases are counted separately and also
passing), same 1 pre-existing failing suite (unrelated, untouched). `npm
run build` — succeeds, all new routes present (`/events/[slug]/tickets`,
`/orders/[secureToken]`, `/admin/orders`, `/admin/orders/[id]`,
`/api/cron/reservations`). **Live-checked in the dev server** — this was
essential, not optional, for this batch specifically: found and fixed the
`/orders/[secureToken]` crash described above; confirmed the fix with a
fresh browser tab (zero console errors, `200 OK` on the same previously-
crashing URL); confirmed `/events/[slug]/tickets` correctly 404s with its
flags off; confirmed `/admin/orders` and `/admin/feed` both correctly
redirect an unauthenticated visitor to `/admin/login`; confirmed the
homepage and `/journey` (Batch F's own regression surface) still render
with zero console errors after this batch's webhook-route changes.

**Not verified live** (no admin credentials, no Stripe test-mode
webhooks, no live database): an actual end-to-end ticket purchase
(reservation → order → Stripe Elements → webhook settlement → order
status flips to `'paid'`), a concurrent-reservation race under real load
(the pure decision function is tested; the advisory-lock behavior that
makes it safe under real concurrency is not — this is explicitly the same
category of gap Batch H's ticket redemption is required to close with a
real concurrent-request test before that batch is done, and the same
standard should apply here before this checkout path sees real traffic),
an actual Stripe webhook event hitting the domain resolver, and an admin-
issued refund actually reaching Stripe. **Manual follow-up for the
user**: with `PAYMENTS_PROVIDER=mock` (or `offline`) and `eventsEnabled`
+ `ticketSalesEnabled` on, publish an event with a ticket type via
`/admin/events`, buy a ticket through `/events/[slug]/tickets`, confirm
`/orders/[secureToken]` shows `'paid'`, confirm the campaign homepage/
leaderboard totals are unchanged before/after, then issue a partial
refund from `/admin/orders/[id]` and confirm the order's status becomes
`'partially_refunded'` without any ticket-voiding side effect (there's
nothing to void yet, but the money side alone should work end to end).

## Batch H — Ticket issuance, email, and check-in

Status: **done, with one required verification NOT run — read the
Concurrency section below before treating this as production-ready.**

### A retroactive fix to Batch G, done first
The plan approval's correction #1 ("ticket credentials must use a
regenerable HMAC-signed deterministic credential... apply the same
pattern to order-confirmation links") applies to order-confirmation links
too — but Batch G shipped `commerce_orders.secureToken` as a stored
random token (matching `shareLinks.code`'s precedent), not that pattern.
Since migration 0017 had never been applied anywhere, this was fixed in
place rather than carried forward as a known inconsistency:
- `lib/security/signed-credential.ts` (new) — the shared primitive:
  `signCredential(id, version, secret)` → `` `${id}.${version}.${hmac}` ``,
  `verifyCredential(token, secret)` → `{id, version} | null`, constant-time
  comparison via `timingSafeEqual`. Tested in
  `tests/signed-credential.test.ts` (9 cases: round-trip, determinism,
  version-bump invalidation, wrong-secret rejection, tampered-id/tampered-
  version rejection with the original signature reused, malformed
  segment counts, non-integer/negative version, empty/oversized input).
- `lib/commerce/order-credentials.ts` — thin wrapper using
  `ORDER_SIGNING_SECRET`.
- `commerce_orders.secure_token` → `commerce_orders.credential_version`
  (integer, default 0) in both `lib/db/schema/commerce.ts` and
  `lib/db/migrations/0017_commerce_orders.sql` (edited directly, with a
  new header note explaining why — not layered as a separate migration,
  since nothing has ever applied the old shape). `createOrder()`,
  `getOrderBySecureToken()` updated to sign/verify instead of store/look
  up; new `regenerateOrderCredential()` + an admin "regenerate
  confirmation link" action/button on `/admin/orders/[id]` (bumping the
  version invalidates every previously issued link at once — no stored
  token to rotate).

### Schema and migration
- `lib/db/schema/tickets.ts` (new): `tickets` (one row per admission unit,
  `credential_version` not `token_hash` — see above; `status`:
  `valid|checked_in|void` is the single source of truth, nothing else
  mutates it) and `ticket_check_ins` (append-only audit trail: check_in /
  reversal / void / reissue).
- `lib/db/migrations/0018_tickets.sql` — hand-authored, `IF NOT EXISTS`-
  guarded, same policy as 0013–0017. Generated and reviewed, **not
  applied**.

### Issuance (`lib/tickets/issue.ts`)
`issueTicketsForOrder(tx, orderId)` mints one `tickets` row per unit
purchased, called from **inside** `lib/commerce/orders.ts`'s
`settleOrder()` transaction (for `orderType: 'ticket'` orders only) — a
reader can never see a paid ticket order with zero tickets, or vice
versa. Idempotent by construction: counts existing tickets per order item
before minting, so even if `settleOrder()`'s own settled-state early-
return were somehow bypassed, issuance itself can't double-mint.
`displayCode` uses a hand-transcription-safe alphabet (no 0/O/1/I),
collision-checked with a retry loop matching the slug-uniqueness pattern
already used elsewhere in this initiative (e.g. `lib/feed/admin-actions.ts`).

### Redemption (`lib/tickets/checkin.ts`, `lib/tickets/redemption-decision.ts`)
- `redemptionDecision()` — pure classification (`success | already_checked_in
  | void | wrong_event`), split out for testability. `tests/
  ticket-redemption-decision.test.ts` (6 cases, including "wrong_event
  takes priority over the ticket's own status" so a checked-in ticket
  scanned at the wrong door reports wrong_event, not already_checked_in).
- `redeemTicket()` — resolves a scanned QR (full HMAC credential) or
  manually-typed code (the short `displayCode`) to a ticket row, checks
  event scoping, then runs a single **atomic conditional `UPDATE ...
  WHERE status = 'valid'`**. This is Postgres's own row-level locking on
  `UPDATE`, not an application-level lock — unlike `lib/commerce/
  reservations.ts`'s capacity check (which needs `pg_advisory_xact_lock`
  because it reads-then-decides-then-writes across multiple rows), a
  single conditional write against one row is already safe under
  concurrency without one. A credential verified under a since-rotated
  `credentialVersion` is rejected even though its HMAC still checks out
  (the secret hasn't changed) — same discipline as
  `getOrderBySecureToken()`.
- `reverseCheckIn()` / `voidTicket()` / `reissueTicket()` — admin-only
  state transitions, each writing its own `ticket_check_ins` row.
  **A real bug caught and fixed before it shipped**: the first draft of
  `voidTicket()`'s guard clause was `eq(status, status)` — comparing the
  status column to itself, always true, meaning it would have silently
  re-voided an already-void ticket (and skipped writing an audit row)
  instead of reporting `already_void`. Caught by re-reading the function
  immediately after writing it, before any test or build touched it;
  fixed to `ne(status, 'void')` with a proper audit-row write on success.

### Concurrency — REQUIRED, NOT run in this session
The plan is explicit: this batch isn't done until a real concurrent-load
test passes against a real Postgres connection. This session has none —
every test in this repo's suite is a pure-function test for exactly this
reason (see the campaign-isolation test in Batch G's section for the
same limitation stated a different way). What was actually delivered
instead:
- `scripts/test-ticket-concurrency.ts` — a ready-to-run script that seeds
  its own throwaway event/ticket-type/order/ticket via a raw Neon
  connection (same pattern as `lib/db/seed.ts`, to avoid the
  `'server-only'` import guard — see below), fires 15 concurrent
  redemption requests at the SAME ticket, asserts exactly 1 succeeds and
  the other 14 report `already_checked_in` with the winner's own
  timestamp, and cleans up every row it created regardless of outcome.
  Run via `npm run tickets:test-concurrency`.
- **A real, structural discovery while building this**: `redeemTicket()`
  can't be imported directly by a plain Node script at all —
  `lib/db/write.ts` (and everything downstream of it) is marked
  `'server-only'`, which throws immediately outside Next.js's
  "react-server" module condition, which a bare `tsx` script never sets.
  This isn't specific to this function; it's true of nearly every
  `lib/**/*.ts` file in this codebase, and it silently affects the
  *pre-existing* `scripts/open-song-campaigns.ts` too (confirmed live —
  that script currently fails immediately on an unrelated top-level-await/
  CJS transform error before it would even reach this issue; both are
  pre-existing environment gaps, not something introduced or fixed by
  this batch). The fix that keeps the test meaningful rather than reduced
  to reimplementing the logic under test: `app/api/dev/redeem-test/route.ts`,
  a purpose-built POST endpoint that calls `redeemTicket()` from inside
  the actual Next.js server runtime (where `'server-only'` is fine), hard-
  blocked in production (`NODE_ENV` check) and gated behind the existing
  `CRON_SECRET` bearer token — two independent gates. The script fires its
  concurrent attempts as HTTP requests against this route instead of a
  direct function call, so the test exercises the real code path.
  **Confirmed the script itself runs cleanly up to its own precondition
  checks** (`TICKET_SIGNING_SECRET is not set` — the expected, correct
  failure with no secret configured) — not run to completion, since doing
  so requires secrets this session isn't setting and a running dev server.
  **Manual follow-up REQUIRED before ticketing is considered production-
  ready**: set `TICKET_SIGNING_SECRET`/`ORDER_SIGNING_SECRET`/`CRON_SECRET`
  in `.env.local`, apply migrations 0016–0018, run `npm run dev` in one
  terminal and `npm run tickets:test-concurrency` in another, and confirm
  it prints `PASS`.

### Email (`lib/tickets/notify.ts`, `lib/email/templates.ts`)
`ticket_order_confirmation` — a real template (not just a declared kind;
see the architecture plan's risk table on why that gap matters), each
ticket's own link built from `ticketCredential(id, credentialVersion)`.
Queued/delivered the same way as every other notification in this
initiative (`lib/notifications/outbox.ts`'s `deliverNotification`, called
outside `settleOrder()`'s transaction, wrapped in try/catch — an email
outage can never roll back or misreport a successful payment).

### Public route (`app/tickets/[secureToken]/page.tsx`)
Read-only — the buyer's confirmation page can display a QR (via the
newly-installed `qrcode` package, explicitly pre-approved by the plan as
a narrowly-justified dependency for this exact batch) and the fallback
display code, but has no write path at all, matching the plan's "no
public endpoint can ever mark a ticket used" requirement literally: this
file contains zero mutations. Flag-gated behind `ticketSalesEnabled`
before querying `tickets`/`live_events` — same fix, same reasoning, as
Batch G's `/orders/[secureToken]` regression; **live-verified** this time
*before* shipping rather than discovered after.

### Admin surfaces
- `app/admin/(dash)/check-in/page.tsx` + `components/admin/CheckInForm.tsx`
  — event selector + scan/type input, `moderator` role (launch role
  table: "moderator: feed moderation and ticket check-in"), inline
  reversal action when the result is `already_checked_in`. Lives under the
  same `(dash)` layout/auth as every other admin page in this initiative
  rather than a standalone kiosk layout — a deliberate, documented scope
  reduction (simpler and safer for this batch; a dedicated full-screen
  check-in layout is a reasonable future polish item, not a correctness gap).
- `app/admin/(dash)/events/[id]/attendees/page.tsx` +
  `components/admin/TicketAttendeeRow.tsx` — full ticket list per event,
  void/reissue actions. Role: `moderator` **and** `finance_admin` both
  allowed — voiding/reissuing isn't named explicitly in the launch role
  table (it sits between "check-in," moderator's domain, and "order
  details," finance_admin's), resolved the same broadest-reasonable-
  reading way Batch C resolved an equivalent gap for feed moderation.
- `components/admin/ResendTicketsForm.tsx` on `/admin/orders/[id]` (ticket
  orders only) — reuses `retryNotification()` against the existing
  notification row by dedupe key rather than re-queuing a duplicate,
  falling back to a fresh `sendTicketOrderConfirmation()` only if no
  notification row exists yet.
- Nav entries added to `app/admin/(dash)/layout.tsx` (Check-in) and a link
  from the event detail page to its attendees list.

### Package installed
`qrcode` + `@types/qrcode` — explicitly named by the plan as pre-approved
for this exact batch ("mentioned examples: qrcode, @zxing/browser for
later ticket batches"). No other new dependency.

### Verification
`npm run typecheck && npm run lint && npm run build` — all clean; lint
scoped to this batch's files (including the new dev-only test route and
script) shows zero errors/warnings, full-repo lint matches baseline.
`npm test` — 239 passing (224 baseline + 15 new: 9 signed-credential + 6
redemption-decision cases), same 1 pre-existing failing suite (unrelated,
untouched). `npm run build` — succeeds, all new routes present
(`/tickets/[secureToken]`, `/admin/check-in`,
`/admin/events/[id]/attendees`, `/api/dev/redeem-test`).
**Live-checked in the dev server**: `/tickets/[secureToken]` with a
nonexistent token renders the friendly not-found state (no crash) with
the flag at its real default; `/admin/check-in` and
`/admin/events/[id]/attendees` both correctly redirect an unauthenticated
visitor to `/admin/login`; `/orders/[secureToken]` and the homepage still
work correctly after the order-credential retrofit; a fresh tab on the
homepage shows zero console errors.

**Not verified live** (beyond the concurrency test discussed above): an
actual issued ticket's email/QR/display-code rendering correctly end to
end, an actual scan-based redemption through `/admin/check-in`, and the
void/reissue/reversal admin actions against a real ticket. **Manual
follow-up for the user**: after running the concurrency test successfully,
buy a real ticket through the Batch G checkout flow with
`eventsEnabled`+`ticketSalesEnabled` on, confirm the email/QR/ticket page
all render correctly, then check it in via `/admin/check-in`, confirm a
second attempt reports already-checked-in, reverse it, check in again,
then try void and reissue from `/admin/events/[id]/attendees`.

## Batch I — Shop catalog and inventory
Status: not started.

## Batch J — Shop checkout, orders, and fulfillment
Status: not started.

## Batch K — Shop preview and launch hardening
Status: not started.

---

## How to continue this in a fresh session

1. Read this file fully, then the architecture plan at
   `C:\Users\Osman\.claude\plans\robust-exploring-kernighan.md`.
2. Run `npm run typecheck && npm run lint && npm test && npm run build` to
   confirm you're starting from the green baseline this batch left.
3. Pick the next unchecked batch, in order (each depends on the ones
   before it per the plan's dependency table).
4. Same verification bar every batch: typecheck/lint/build/test green,
   plus whatever concurrency/integration tests that specific batch calls
   for (reservation races, redemption races, webhook idempotency) before
   it's considered done — not just "it compiled."
5. Update this file's batch section (work completed, commit hash, files
   changed, migration generated y/n, test results, outstanding risks,
   next batch) before ending the turn.
6. Do not push to `origin` or deploy without the user's explicit,
   separate confirmation — see the note above about the conflicting
   instruction in the approval message.
