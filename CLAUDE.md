# MJ COBE — Engineering Constitution

Read `INSTRUCTIONS - WHAT IS THE WEBSITE.md` to understand the project.
Read `docs/PRD.md` for product scope and `docs/DESIGN.md` for visual law and `C\Users\Osman\mj cobe site mockups\` for visual mockups.
Those two documents are authoritative. This file is how we build.

## What this is
A living campaign platform for a digitally-generated R&B artist. Fans and
businesses back individual songs. Leaderboards, outbidding, supporter numbers,
sponsor placement. It must feel like a luxury music label site, not a
crowdfunding page. If a decision makes it feel more like Kickstarter, it is wrong.

## Non-negotiable rules

### Money
- All monetary values are INTEGER CENTS. Never floats. Never `number` for
  currency without the `Cents` branded type. Format only at the render edge.
- No business logic file may import Stripe, ever. Payments go through
  `lib/payments/provider.ts` only.
- Balances and totals are DERIVED from append-only `ledger_entries`.
  Never store a mutable running total as source of truth.
- Only transactions in state `settled` count toward any public number.

### Data integrity
- Every admin mutation writes an `audit_log` row: actor, action, entity,
  before, after, reason, ip, timestamp. No exceptions.
- Every payment-adjacent webhook/event handler is idempotent via the
  `webhook_events` dedupe table.
- Consent text is versioned: store the hash of the exact disclaimer the user
  agreed to on the transaction row.

### Copy and config
- ZERO hard-coded user-facing strings. All copy resolves through `site_copy`
  (DB) with a typed file-based default fallback in `lib/copy/defaults.ts`.
- Zero hard-coded prices, tiers, goals, bid increments, leaderboard sizes,
  thresholds, or dates. All live in `settings` or their own tables.
- New behavior ships behind a row in `feature_flags`.

### Next.js
- Server Components by default. `"use client"` only for interactivity, and
  push it to the smallest possible leaf component.
- Mutations are Server Actions with Zod validation at the boundary.
- No `useEffect` for data fetching. No client-side fetch waterfalls.
- Public pages are statically rendered or ISR-cached; live numbers stream in.

### Testing
- The ranking engine and the transaction state machine get unit + property
  tests BEFORE any feature depends on them.
- Do not write tests for styling. Do write Playwright happy paths later.

## Working method — READ THIS
1. We build in vertical slices. One slice per branch, per session.
2. Always start in plan mode. Present the plan. WAIT for my approval.
   Do not write code in the same turn as the plan.
3. Do not scaffold future slices. Build only what the current slice needs.
4. If the PRD is ambiguous, state the ambiguity and propose a default.
   Do not silently invent product behavior.
5. When you finish a slice: run typecheck, run lint, run tests, screenshot
   the affected routes with Playwright, then summarize what changed in
   plain language and list what you deliberately did NOT do.
6. Never say a task is done if typecheck or lint fails.

## Style
- TypeScript strict. No `any`. No non-null `!` assertions.
- Small files. If a component passes ~150 lines, split it.
- Name things like a person would: `SupporterRow`, not `SupporterRowComponent`.
- Comments explain WHY, never WHAT.

## Absolutely forbidden
- Installing shadcn/ui, DaisyUI, Chakra, MUI, or any component library with
  an opinionated default theme. We hand-build primitives.
- Emoji in the UI. (Emoji allowed in email and social caption copy only.)
- The banned visual list in `docs/DESIGN.md`. Treat it as a compile error.
- Placeholder Lorem Ipsum. Use realistic MJ COBE seed copy.
