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

Status: not started yet in this pass (next).

## Batch C — Moderated feed foundation
Status: not started.

## Batch D — Secure brand submissions
Status: not started.

## Batch E — Feed navigation and homepage preview
Status: not started.

## Batch F — Events and Journey integration
Status: not started.

## Batch G — Shared commerce and ticket checkout
Status: not started.

## Batch H — Ticket issuance, email, and check-in
Status: not started.

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
