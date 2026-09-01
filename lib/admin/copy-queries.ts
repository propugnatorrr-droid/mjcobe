import 'server-only';

import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import {
  copy,
  copyKeys,
  type CopyKey,
} from '@/lib/copy/defaults';

export type CopyRow = {
  key: CopyKey;
  fallback: string;
  override: string | null;
  effective: string;
  group: string;
};

/** Keys group by their prefix, which is how the copy file is organised. */
function groupOf(key: string): string {
  const [head] = key.split('.');
  return head ?? 'other';
}

export async function listCopyRows(
  filter?: string,
): Promise<CopyRow[]> {
  const rows = await db
    .select()
    .from(s.siteCopy);

  const overrides = new Map(
    rows.map((row) => [
      row.key,
      row.value,
    ]),
  );

  const needle =
    filter?.trim().toLowerCase() ?? '';

  return copyKeys
    .map((key) => {
      const fallback = copy(key);
      const override =
        overrides.get(key) ?? null;

      return {
        key,
        fallback,
        override,
        effective: override ?? fallback,
        group: groupOf(key),
      };
    })
    .filter((row) =>
      needle.length === 0
        ? true
        : row.key
            .toLowerCase()
            .includes(needle) ||
          row.effective
            .toLowerCase()
            .includes(needle),
    );
}

export async function countCopyOverrides(): Promise<number> {
  const rows = await db
    .select()
    .from(s.siteCopy);

  /*
   * Overrides for keys no longer in the code are
   * counted separately so they can be cleaned up.
   */
  const known = new Set<string>(
    copyKeys,
  );

  return rows.filter((row) =>
    known.has(row.key),
  ).length;
}
