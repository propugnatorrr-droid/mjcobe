import 'server-only';

import {
  del,
  put,
} from '@vercel/blob';
import {
  desc,
  eq,
  sql,
} from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';

export const MAX_LOGO_BYTES =
  2 * 1024 * 1024;

const ALLOWED_LOGO_TYPES = new Set([
  'image/png',
  'image/webp',
]);

export type SponsorLogoValidation =
  | {
      ok: true;
      file: File | null;
      detectedType: 'image/png' | 'image/webp' | null;
    }
  | {
      ok: false;
      reason: 'type' | 'size' | 'signature';
    };

function isPng(bytes: Uint8Array): boolean {
  const signature = [
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
  ];

  return signature.every(
    (value, index) =>
      bytes[index] === value,
  );
}

function isWebp(
  bytes: Uint8Array,
): boolean {
  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

export async function validateSponsorLogo(
  value: FormDataEntryValue | null,
): Promise<SponsorLogoValidation> {
  if (
    !(value instanceof File) ||
    value.size === 0
  ) {
    return {
      ok: true,
      file: null,
      detectedType: null,
    };
  }

  if (
    !ALLOWED_LOGO_TYPES.has(value.type)
  ) {
    return {
      ok: false,
      reason: 'type',
    };
  }

  if (value.size > MAX_LOGO_BYTES) {
    return {
      ok: false,
      reason: 'size',
    };
  }

  const header = new Uint8Array(
    await value
      .slice(0, 12)
      .arrayBuffer(),
  );

  const detectedType = isPng(header)
    ? 'image/png'
    : isWebp(header)
      ? 'image/webp'
      : null;

  if (
    !detectedType ||
    detectedType !== value.type
  ) {
    return {
      ok: false,
      reason: 'signature',
    };
  }

  return {
    ok: true,
    file: value,
    detectedType,
  };
}

function safeFileName(
  name: string,
  type: 'image/png' | 'image/webp',
): string {
  const extension =
    type === 'image/webp'
      ? 'webp'
      : 'png';

  const base = name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

  return `${
    base || 'sponsor-logo'
  }.${extension}`;
}

async function createLogoAsset(args: {
  file: File;
  role: 'logo' | 'sponsor-logo-pending';
  derivatives?: Record<string, string>;
}): Promise<string> {
  const type =
    args.file.type === 'image/webp'
      ? 'image/webp'
      : 'image/png';

  const pathname = [
    'sponsor-logos',
    `${Date.now()}-${safeFileName(
      args.file.name,
      type,
    )}`,
  ].join('/');

  const blob = await put(
    pathname,
    args.file,
    {
      access: 'public',
      addRandomSuffix: true,
      contentType: type,
    },
  );

  try {
    const [asset] = await dbw
      .insert(s.mediaAssets)
      .values({
        kind: 'logo',
        role: args.role,
        path: blob.url,
        bytes: args.file.size,
        derivatives:
          args.derivatives ?? {},
      })
      .returning({
        id: s.mediaAssets.id,
      });

    if (!asset) {
      throw new Error(
        'Sponsor logo asset was not created',
      );
    }

    return asset.id;
  } catch (error) {
    await del(blob.url).catch(() => {
      // The database remains authoritative.
      // Orphan cleanup can retry Blob deletion later.
    });

    throw error;
  }
}

export async function storeSponsorLogo(
  file: File,
): Promise<string> {
  return createLogoAsset({
    file,
    role: 'logo',
  });
}

export type PendingSponsorLogo = {
  id: string;
  path: string;
  createdAt: Date;
};

export async function getPendingSponsorLogos(
  sponsorId: string,
): Promise<PendingSponsorLogo[]> {
  const rows = await db
    .select({
      id: s.mediaAssets.id,
      path: s.mediaAssets.path,
      createdAt:
        s.mediaAssets.createdAt,
    })
    .from(s.mediaAssets)
    .where(
      sql`
        ${s.mediaAssets.role}
          = 'sponsor-logo-pending'
        and
        ${s.mediaAssets.derivatives}
          ->> 'pendingSponsorId'
          = ${sponsorId}
      `,
    )
    .orderBy(
      desc(s.mediaAssets.createdAt),
    );

  return rows;
}

function isManagedBlobUrl(
  path: string,
): boolean {
  try {
    const url = new URL(path);

    return (
      url.protocol === 'https:' &&
      url.hostname.endsWith(
        '.blob.vercel-storage.com',
      )
    );
  } catch {
    return false;
  }
}

export async function deleteUnreferencedLogoAsset(
  assetId: string,
): Promise<boolean> {
  const [asset] = await db
    .select({
      id: s.mediaAssets.id,
      kind: s.mediaAssets.kind,
      role: s.mediaAssets.role,
      path: s.mediaAssets.path,
    })
    .from(s.mediaAssets)
    .where(
      eq(s.mediaAssets.id, assetId),
    )
    .limit(1);

  if (
    !asset ||
    asset.kind !== 'logo'
  ) {
    return false;
  }

  const [reference] = await db
    .select({
      id: s.sponsors.id,
    })
    .from(s.sponsors)
    .where(
      eq(
        s.sponsors.logoAssetId,
        assetId,
      ),
    )
    .limit(1);

  if (reference) {
    return false;
  }

  await dbw
    .delete(s.mediaAssets)
    .where(
      eq(s.mediaAssets.id, assetId),
    );

  if (isManagedBlobUrl(asset.path)) {
    await del(asset.path).catch(() => {
      // The database reference has been removed.
      // A Blob lifecycle cleanup can remove
      // an unreachable object if deletion fails.
    });
  }

  return true;
}

export async function storePendingSponsorLogo(
  file: File,
  sponsorId: string,
): Promise<string> {
  const previous =
    await getPendingSponsorLogos(
      sponsorId,
    );

  const assetId = await createLogoAsset({
    file,
    role: 'sponsor-logo-pending',
    derivatives: {
      pendingSponsorId: sponsorId,
    },
  });

  for (const asset of previous) {
    await deleteUnreferencedLogoAsset(
      asset.id,
    );
  }

  return assetId;
}
