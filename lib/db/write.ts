import 'server-only';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

/**
 * Writes go through a pooled WebSocket connection because the HTTP driver
 * cannot hold a multi-statement transaction. Creating a contribution touches
 * five tables; a partial write would record money against nobody.
 */
if (typeof WebSocket === 'undefined') {
  // Node runtimes below 22 have no global WebSocket.
  const ws = require('ws');
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const dbw = drizzle(pool, { schema });
export type WriteTx = Parameters<Parameters<typeof dbw.transaction>[0]>[0];
