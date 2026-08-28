import 'server-only';

import {
  randomBytes,
} from 'node:crypto';
import {
  eq,
} from 'drizzle-orm';
import {
  dbw,
} from '@/lib/db/write';
import {
  db,
} from '@/lib/db/client';
import * as s from '@/lib/db/schema';

function makeCode(): string {
  return randomBytes(16).toString(
    'base64url',
  );
}

function safeTargetPath(
  value: string,
): string {
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    throw new Error(
      'Share target must be a same-origin relative path.',
    );
  }

  return value;
}

export async function createThanksToken(
  args: {
    contributionId: string;
    targetPath: string;
  },
): Promise<string> {
  const code = makeCode();

  await dbw
    .insert(s.shareLinks)
    .values({
      code,
      targetPath:
        safeTargetPath(
          args.targetPath,
        ),
      contributionId:
        args.contributionId,
    });

  return code;
}

export async function resolveThanksToken(
  code: string,
) {
  if (
    code.length < 12 ||
    code.length > 64 ||
    !/^[A-Za-z0-9_-]+$/.test(code)
  ) {
    return null;
  }

  const [row] = await db
    .select()
    .from(s.shareLinks)
    .where(
      eq(
        s.shareLinks.code,
        code,
      ),
    )
    .limit(1);

  return row ?? null;
}
