import 'server-only';
import { cache } from 'react';
import { db } from '@/lib/db/client';
import { settings } from '@/lib/db/schema';
import { config, type ConfigKey } from './defaults';

/**
 * DB-backed settings with the file defaults as fallback. Cached per request.
 * Client components receive resolved values as props — they never read this.
 */
export const loadSettings = cache(async (): Promise<Map<string, unknown>> => {
  try {
    const rows = await db.select().from(settings);
    return new Map(rows.map((r) => [r.key, r.value]));
  } catch {
    // A settings-table outage must not take the site down; fall back to file.
    return new Map();
  }
});

export async function setting<K extends ConfigKey>(key: K): Promise<(typeof import('./defaults'))extends never ? never : ReturnType<typeof config<K>>> {
  const overrides = await loadSettings();
  return (overrides.has(key) ? overrides.get(key) : config(key)) as ReturnType<typeof config<K>>;
}
