import 'server-only';
import { cache } from 'react';
import { db } from '@/lib/db/client';
import { siteCopy } from '@/lib/db/schema';
import { copy, type CopyKey } from './defaults';

export const loadCopy = cache(async (): Promise<Map<string, string>> => {
  try {
    const rows = await db.select().from(siteCopy);
    return new Map(rows.map((r) => [r.key, r.value]));
  } catch {
    return new Map();
  }
});

/** Server-side copy resolution. Interpolates {token} placeholders. */
export async function text(key: CopyKey, vars?: Record<string, string | number>): Promise<string> {
  const overrides = await loadCopy();
  const raw = overrides.get(key) ?? copy(key);
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
