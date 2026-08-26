import 'server-only';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { dbw } from '@/lib/db/write';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';

/** URL-safe, unguessable, and short enough to read aloud. */
function makeCode(): string {
  return randomBytes(9).toString('base64url');
}

export async function createThanksToken(args: {
  contributionId: string;
  targetPath: string;
}): Promise<string> {
  const code = makeCode();
  await dbw.insert(s.shareLinks).values({
    code,
    targetPath: args.targetPath,
    contributionId: args.contributionId,
  });
  return code;
}

export async function resolveThanksToken(code: string) {
  const [row] = await db
    .select()
    .from(s.shareLinks)
    .where(eq(s.shareLinks.code, code))
    .limit(1);
  return row ?? null;
}
