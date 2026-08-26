import 'server-only';
import { cache } from 'react';
import { db } from '@/lib/db/client';
import { settings } from '@/lib/db/schema';
import { config, type ConfigKey } from './defaults';

export const loadSettings = cache(async (): Promise<Map<string, unknown>> => {
  try {
    const rows = await db.select().from(settings);
    return new Map(rows.map((r) => [r.key, r.value]));
  } catch {
    // A settings outage must not take the site down — fall through to file defaults.
    return new Map();
  }
});

/** DB override if present, file default otherwise. */
export async function setting<K extends ConfigKey>(key: K) {
  const overrides = await loadSettings();
  const hit = overrides.get(key);
  return (hit === undefined ? config(key) : hit) as ReturnType<typeof config<K>>;
}

/** Settings that exist only in the DB (no file default), with an explicit fallback. */
export async function settingOr<T>(key: string, fallback: T): Promise<T> {
  const overrides = await loadSettings();
  const hit = overrides.get(key);
  return (hit === undefined ? fallback : hit) as T;
}

export async function flagEnabled(key: string): Promise<boolean> {
  const { featureFlags } = await import('@/lib/db/schema');
  const { eq } = await import('drizzle-orm');
  const [row] = await db.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1);
  return row?.enabled ?? false;
}
