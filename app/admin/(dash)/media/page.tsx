import {
  AdminHeading,
  AdminHint,
} from '@/components/admin/ui';
import {
  listMediaLibrary,
} from '@/lib/admin/media-library';
import { admin } from '@/lib/copy/admin';

export const dynamic =
  'force-dynamic';

function formatBytes(
  bytes: number | null,
): string {
  if (!bytes) {
    return '—';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatDuration(
  durationMs: number | null,
): string {
  if (!durationMs) {
    return '—';
  }

  const totalSeconds =
    Math.floor(
      durationMs / 1000,
    );

  const minutes =
    Math.floor(
      totalSeconds / 60,
    );

  const seconds =
    totalSeconds % 60;

  return `${minutes}:${String(
    seconds,
  ).padStart(2, '0')}`;
}

export default async function MediaLibraryPage() {
  const assets =
    await listMediaLibrary();

  return (
    <>
      <AdminHeading>
        {admin.media.heading}
      </AdminHeading>

      <AdminHint>
        {admin.media.hint}
      </AdminHint>

      {assets.length === 0 ? (
        <p className="text-body text-[var(--text-dim)]">
          {admin.media.empty}
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {assets.map(
            (asset) => (
              <article
                key={asset.id}
                className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--ink-2)]"
              >
                <div className="flex min-h-56 items-center justify-center bg-[var(--ink)]">
                  {asset.kind ===
                  'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.path}
                      alt=""
                      className="max-h-80 w-full object-contain"
                    />
                  ) : null}

                  {asset.kind ===
                  'audio' ? (
                    <audio
                      src={asset.path}
                      controls
                      preload="metadata"
                      className="w-[90%]"
                    />
                  ) : null}

                  {asset.kind !==
                    'image' &&
                  asset.kind !==
                    'audio' ? (
                    <a
                      href={asset.path}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-eyebrow uppercase text-[var(--champagne)]"
                    >
                      {
                        admin.media
                          .openFile
                      }
                    </a>
                  ) : null}
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                      {asset.kind}
                    </span>

                    <span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                      {asset.role}
                    </span>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-4">
                    <div>
                      <dt className="font-mono text-eyebrow uppercase text-[var(--text-faint)]">
                        {
                          admin.media
                            .fileSize
                        }
                      </dt>

                      <dd className="mt-1 text-body text-[var(--text)]">
                        {formatBytes(
                          asset.bytes,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-mono text-eyebrow uppercase text-[var(--text-faint)]">
                        {
                          admin.media
                            .duration
                        }
                      </dt>

                      <dd className="mt-1 text-body text-[var(--text)]">
                        {formatDuration(
                          asset.durationMs,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-mono text-eyebrow uppercase text-[var(--text-faint)]">
                        {
                          admin.media
                            .dimensions
                        }
                      </dt>

                      <dd className="mt-1 text-body text-[var(--text)]">
                        {asset.width &&
                        asset.height
                          ? `${asset.width} × ${asset.height}`
                          : '—'}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-mono text-eyebrow uppercase text-[var(--text-faint)]">
                        {
                          admin.media
                            .uploaded
                        }
                      </dt>

                      <dd className="mt-1 text-body text-[var(--text)]">
                        {asset.createdAt.toLocaleDateString(
                          'en-US',
                          {
                            timeZone:
                              'UTC',
                          },
                        )}
                      </dd>
                    </div>
                  </dl>

                  <a
                    href={asset.path}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 block break-all font-mono text-[0.625rem] text-[var(--text-faint)] hover:text-[var(--champagne)]"
                  >
                    {asset.path}
                  </a>
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </>
  );
}
