import 'server-only';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

/**
 * Writes go through a pooled WebSocket connection because the HTTP driver
 * cannot hold a multi-statement transaction. Creating a contribution touches
 * five tables; a partial write would record money against nobody.
 */
// Node 22+ (Vercel's default) exposes a global WebSocket; no `ws` shim needed.
neonConfig.webSocketConstructor = globalThis.WebSocket;

let pool: Pool | null = null;

function writeDb(): NeonDatabase<typeof schema> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  pool ??= new Pool({ connectionString: url });
  return drizzle(pool, { schema });
}

/** Lazy so a missing env var fails the request, not the build. */
export const dbw = new Proxy({} as NeonDatabase<typeof schema>, {
  get: (_t, prop) => Reflect.get(writeDb(), prop),
});

export type WriteTx = Parameters<Parameters<typeof dbw.transaction>[0]>[0];
