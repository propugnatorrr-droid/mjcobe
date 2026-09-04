import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The single hardest constraint on this whole standalone-commerce
 * initiative: nothing in the commerce domain may ever read or write the
 * campaign-money tables (contributions, transactions, refunds,
 * ledger_entries, disputes). A DB-integration test proving this at
 * runtime would need live database access this test suite doesn't have —
 * every other test in this repo is a pure-function test for the same
 * reason. This is the next-best real regression test: it reads the
 * actual committed source of the commerce module and asserts none of it
 * references those tables' Drizzle identifiers. If a future change adds
 * `s.contributions`/`s.transactions`/`s.refunds`/`s.ledgerEntries`/
 * `s.disputes` to any of these files, this test fails immediately rather
 * than silently shipping a campaign-money leak.
 */
const COMMERCE_SOURCE_FILES = [
  'lib/commerce/orders.ts',
  'lib/commerce/reservations.ts',
];

const FORBIDDEN_IDENTIFIERS = [
  's.contributions',
  's.transactions',
  's.refunds',
  's.ledgerEntries',
  's.disputes',
  's.consentRecords',
  's.supporterNumbers',
];

describe('commerce module never touches campaign-money tables', () => {
  for (const file of COMMERCE_SOURCE_FILES) {
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');

    for (const identifier of FORBIDDEN_IDENTIFIERS) {
      it(`${file} does not reference ${identifier}`, () => {
        expect(source.includes(identifier)).toBe(false);
      });
    }
  }
});
