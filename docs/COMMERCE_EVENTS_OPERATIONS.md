# Commerce, Events & Ticketing — Operations Guide

This is the day-to-day runbook for the standalone commerce initiative
(moderated brand feed, live events, ticketing, shop). For how it was
built and what's still unverified, read
`docs/STANDALONE_COMMERCE_FEED_TICKETING_PROGRESS.md` first — that file
is the engineering handoff; this one is for running it once it's live.

## Before any of this goes live

1. **Apply the migrations.** Every migration from this initiative
   (`lib/db/migrations/0013` through `0020`) was generated and reviewed
   but **never applied** — that was a deliberate, standing rule for the
   entire build. Confirm each one against the real database before
   enabling any flag that depends on it (see the table below for which
   flag needs which migrations).
2. **Set the required environment variables** (see below). Two of them —
   `TICKET_SIGNING_SECRET` and `ORDER_SIGNING_SECRET` — are new secrets
   this initiative introduced. Generate them with something like
   `openssl rand -base64 32` and never reuse one for the other; they're
   deliberately separate so a leaked order-confirmation secret can't be
   used to forge a physical admission credential.
3. **Run the concurrency test** (`npm run tickets:test-concurrency`, see
   its own header comment) against a real environment before ticket
   check-in sees a real door. This was written but never executed during
   the build — see the Batch H section of the progress doc for exactly
   why and what "passing" looks like.
4. **Decide shipping and tax strategy** before turning on `shopEnabled`.
   The build shipped with shipping and tax both hard-coded to $0.00,
   explicitly disclosed to the buyer at checkout — this is a placeholder,
   not a recommendation. Changing it means editing `lib/shop/checkout-actions.ts`'s
   `createOrder()` call (currently omits `taxCents`/`shippingCents`
   entirely, which default to 0) — nothing in the schema needs to change,
   `commerce_orders` already has both columns.

## Required environment variables

| Variable | Used by | Notes |
|---|---|---|
| `TICKET_SIGNING_SECRET` | `lib/tickets/credentials.ts` | HMAC key for ticket QR/URL credentials. Rotating it invalidates every issued ticket at once — don't rotate casually. |
| `ORDER_SIGNING_SECRET` | `lib/commerce/order-credentials.ts` | HMAC key for `/orders/[secureToken]` links. Same rotation caveat. |
| `CRON_SECRET` | `app/api/cron/reservations/route.ts` (and the pre-existing notification/reconcile crons) | Bearer token the Vercel cron jobs authenticate with. Also gates `app/api/dev/redeem-test/route.ts` — see below. |
| `PAYMENTS_PROVIDER` | `lib/payments/index.ts` | `mock` \| `offline` \| `stripe`. Same variable the existing campaign checkout already uses — commerce orders go through the identical provider. |
| `NEXT_PUBLIC_SITE_URL` | email templates, JSON-LD | Used to build absolute links in ticket/order confirmation emails and structured data. |

## Feature flags and what each one gates

All flags default to `false` (no row = disabled, per `flagEnabled()`'s
own contract). Toggle them at `/admin/flags` (super_admin only).

| Flag | Gates | Depends on migrations |
|---|---|---|
| `brandFeedEnabled` | `/feed`, `/feed/[slug]`, homepage feed preview, nav/footer feed links | 0013 |
| `brandSubmissionsEnabled` | `/partners/submit/[secureToken]` | 0014, 0015 |
| `eventsEnabled` | `/events`, `/events/[slug]`, journey entries linking to events | 0016 |
| `ticketSalesEnabled` | `/events/[slug]/tickets`, `/orders/[secureToken]`, `/tickets/[secureToken]`, the "Buy Tickets" button | 0016, 0017, 0018 |
| `ticketCheckInEnabled` | **Not currently wired to anything** — `/admin/check-in` is gated by admin auth only, not this flag. Flagged here as a gap: if you want check-in to be independently toggleable from ticket sales, add the check to `app/admin/(dash)/check-in/page.tsx`. |
| `shopEnabled` | `/shop`, `/shop/[slug]`, `/shop/checkout`, homepage shop preview, nav/footer shop links | 0016 (shares `inventory_reservations`), 0017, 0019, 0020 |
| `homeFeedPreviewEnabled` | **Not currently wired to anything separately** — the homepage feed preview is gated by `brandFeedEnabled` alone, not this flag. Same gap as `ticketCheckInEnabled` above; both flags were seeded in Batch A anticipating finer-grained control that the actual implementation didn't end up needing. |
| `homeShopPreviewEnabled` | Same gap as above — gated by `shopEnabled` alone. |

**Practical enabling order**, since some routes assume others:
1. `brandFeedEnabled` → `brandSubmissionsEnabled` (submissions need the feed to exist).
2. `eventsEnabled` → `ticketSalesEnabled` (ticket sales need events to exist).
3. `shopEnabled` (independent of the above).

## Admin roles

Enforced via `requireAdminRole()` (`lib/admin/guard.ts`). `super_admin`
can do everything regardless of the table below.

| Role | Can do |
|---|---|
| `content_admin` | Feed post authoring, event CRUD, product/variant CRUD, product photo upload |
| `partnership_admin` | Brand submission invite issuance/revoke/resend |
| `moderator` | Feed moderation (approve/reject/hide/unpublish), ticket check-in, ticket void/reissue/reversal |
| `finance_admin` | Order refunds, order credential regeneration, ticket resend, shop fulfillment, ticket void/reissue/reversal |
| `analytics_viewer` | Read-only (not specifically wired to any new page in this initiative — existing analytics dashboard only) |

There's no admin UI to assign roles from within this initiative — that's
part of the pre-existing admin user system.

## Common operational tasks

**Issue a brand submission invite**: `/admin/feed/invites` → pick an
*approved* sponsor (unapproved sponsors are rejected at issuance) → set
an expiry → the invite email sends immediately via the existing
notification outbox.

**Approve/reject a feed post**: `/admin/feed/[id]` shows the sponsor
context, the original submission (if edited), and approve/reject/hide/
unpublish actions. A rejected post's `moderation` becomes `blocked` — it
is not deleted, and no notification currently tells the sponsor why.

**Publish an event with tickets**: `/admin/events/new` → fill in
venue/dates/timezone → add one or more ticket types under the event
detail page → set `ticketingEnabled` and `isPublished` → the "Buy
Tickets" button appears on the public event page only once `status`
resolves to the `on_sale` CTA state (see `lib/events/eligibility.ts` for
the exact rules — published, not canceled/postponed/completed, ticketing
enabled, and inside any configured sales window).

**Check in attendees on the day of an event**: `/admin/check-in`, pick
the event from the dropdown, scan or type each ticket's code. A second
scan of the same ticket reports "already checked in" with the original
timestamp and offers a reversal (for "scanned by mistake" — requires a
reason). This page has no offline mode — it requires a live connection to
redeem a ticket, by design (see the architecture plan's decision table,
item 7).

**Issue a refund**: `/admin/orders/[id]` → "Issue Refund" (only shown
once a payment has settled). For ticket orders, **a partial refund never
automatically voids a ticket** — if the refund is meant to remove an
attendee, go to `/admin/events/[id]/attendees` and void the specific
ticket separately. This is deliberate, not a missing feature.

**Mark a shop order shipped**: `/admin/orders/[id]` → fulfillment form
(only shown for shop orders) → set status to `fulfilled` with a tracking
number → the shipment email sends automatically. Editing the same
fulfillment row again later (e.g. fixing a typo) does not re-send the
email — only the actual `unfulfilled` → `fulfilled` transition does.

**Adjust shop inventory**: `/admin/shop/[id]` → variant → "Adjust Stock"
with a signed delta and a reason. Every adjustment writes an
`inventory_movements` row; `stockOnHand` is never edited directly. A
withdrawal that would take stock negative is rejected, not clamped to
zero — if you see that rejection, something else (a reservation bug, a
concurrent sale) already has a claim on that inventory that this
adjustment didn't account for.

## Known gaps (by design, not oversight — see the progress doc for full reasoning)

- **No tax or real shipping calculation.** Both are $0.00 placeholders,
  disclosed to the buyer. See "Before any of this goes live" above.
- **No dispute lifecycle modeling for commerce orders.** A Stripe dispute
  on a shop/ticket payment flips the order to a generic `'disputed'`
  status; it does not track won/lost/needs-response the way
  `lib/ledger/contributions.ts`'s `reconcileDispute()` does for campaign
  contributions.
- **No offline/multi-scanner check-in.** Redemption requires a live
  connection; there's no local queue-and-sync design.
- **No self-service ticket transfer.** A lost/compromised ticket is
  handled by admin void + reissue, not a buyer-facing transfer flow.
- **`ticketCheckInEnabled` and `homeFeedPreviewEnabled`/
  `homeShopPreviewEnabled` flags exist but aren't independently wired**
  (see the feature-flag table above) — seeded in Batch A anticipating
  finer control the actual implementation folded into the parent flags
  instead.
- **`app/api/dev/redeem-test/route.ts` exists in the codebase
  permanently** — it's the test harness for the required concurrency
  test (`scripts/test-ticket-concurrency.ts`), hard-blocked in production
  via `NODE_ENV` and gated behind `CRON_SECRET`. It is not itself a
  vulnerability, but it is attack surface that exists solely to make that
  test runnable; removing it would mean the concurrency test can no
  longer exercise the real `redeemTicket()` code path from outside the
  Next.js process (see that script's own header comment for why a direct
  import doesn't work).

## Where to look when something breaks

- **A page 500s instead of rendering a friendly state**: almost
  certainly a migration that hasn't been applied yet while its flag is
  on, or a route that's missing the flag-gate pattern every other public
  route in this initiative follows (check `flagEnabled(...)` is called
  *before* any query, not after). This happened twice during the build
  itself (`/orders/[secureToken]` in Batch G, caught and fixed the same
  batch) — see the progress doc's regression notes for the exact shape
  of the bug if you're debugging something similar.
- **A webhook event isn't updating an order/ticket**: check
  `lib/payments/webhook-resolver.ts`'s `resolvePaymentDomain()` — if a
  Stripe reference matches neither `transactions` nor `commerce_payments`,
  the webhook route throws a hard error (by design) rather than silently
  dropping the event. Check the Vercel function logs for that error.
- **An email never arrived**: check the `notifications` table
  (`deliveryStatus`, `lastError`, `attemptCount`) — every notification in
  this initiative goes through the same outbox as the existing campaign
  confirmation emails, with the same exponential-backoff retry via the
  existing `/api/cron/notifications` cron.
