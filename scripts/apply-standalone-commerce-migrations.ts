/**
 * One-off runner for migrations 0013–0020 (the standalone commerce/feed/
 * events/ticketing initiative). Not `drizzle-kit migrate` because that
 * command only knows what's in lib/db/migrations/meta/_journal.json, which
 * stops at 0001 — migrations 0002/0003/0012 were applied out-of-band before
 * this initiative existed, and 0013–0020 follow that same hand-authored,
 * IF NOT EXISTS-guarded convention rather than drizzle-kit's own tracking.
 *
 * Every statement in every one of these 8 files is idempotent (CREATE TABLE
 * IF NOT EXISTS, CREATE INDEX IF NOT EXISTS, or a DO $$ IF NOT EXISTS $$
 * guard around ALTER TABLE ADD CONSTRAINT), so re-running this after a
 * partial failure is safe — already-applied statements are no-ops.
 *
 * Splits each file on drizzle-kit's own `--> statement-breakpoint` marker
 * (not on semicolons — several statements are DO $$ ... END $$; blocks that
 * contain their own internal semicolons and must run as one unit) and
 * executes each chunk in order via the Neon serverless driver's raw
 * `.query()`, stopping immediately on the first error rather than
 * continuing past a failure.
 *
 * Run: npx tsx scripts/apply-standalone-commerce-migrations.ts
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local', override: true });

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { neon } from '@neondatabase/serverless';

const MIGRATIONS_DIR = join(__dirname, '..', 'lib', 'db', 'migrations');

const FILES = [
  '0013_brand_feed_posts.sql',
  '0014_brand_submission_invites.sql',
  '0015_feed_submission_attempts.sql',
  '0016_live_events.sql',
  '0017_commerce_orders.sql',
  '0018_tickets.sql',
  '0019_shop_catalog.sql',
  '0020_shop_checkout.sql',
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not set.');

  const host = new URL(databaseUrl).hostname;
  console.log(`Target database host: ${host}`);
  console.log(`Applying ${FILES.length} migration files in order:\n  ${FILES.join('\n  ')}\n`);

  const sql = neon(databaseUrl);

  for (const file of FILES) {
    const path = join(MIGRATIONS_DIR, file);
    const content = readFileSync(path, 'utf8');
    const statements = content
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`\n=== ${file} (${statements.length} statements) ===`);

    for (let i = 0; i < statements.length; i += 1) {
      const statement = statements[i]!;
      const preview = statement.split('\n').find((line) => line.trim().length > 0)?.trim().slice(0, 80) ?? '';
      process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}... `);
      try {
        await sql.query(statement);
        console.log('ok');
      } catch (error) {
        console.log('FAILED');
        console.error(error);
        throw new Error(`Migration ${file}, statement ${i + 1} failed. Stopping — no further statements will run.`);
      }
    }
  }

  console.log('\nAll 8 migration files applied successfully.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nMigration run aborted:', error.message ?? error);
    process.exit(1);
  });
