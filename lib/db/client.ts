import 'server-only';
import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let cached: NeonHttpDatabase<typeof schema> | null = null;

function readDb(): NeonHttpDatabase<typeof schema> {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  cached = drizzle(neon(url), { schema });
  return cached;
}

/** Lazy so a missing env var fails the request, not the build. */
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get: (_t, prop) => Reflect.get(readDb(), prop),
});

export { schema };
