import 'server-only';

import {
  desc,
} from 'drizzle-orm';
import {
  db,
} from '@/lib/db/client';
import * as s from '@/lib/db/schema';

export type MediaLibraryAsset =
  typeof s.mediaAssets.$inferSelect;

export async function listMediaLibrary():
Promise<MediaLibraryAsset[]> {
  return db
    .select()
    .from(s.mediaAssets)
    .orderBy(
      desc(
        s.mediaAssets.createdAt,
      ),
    );
}
