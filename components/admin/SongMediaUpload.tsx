'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  upload,
} from '@vercel/blob/client';
import {
  registerSongMedia,
} from '@/lib/admin/song-media-actions';
import {
  SONG_MEDIA_POLICY,
  type SongMediaKind,
} from '@/lib/media/song-media-policy';
import { admin } from '@/lib/copy/admin';

type Asset = {
  path: string;
  width: number | null;
  height: number | null;
  durationMs: number | null;
};

function fileExtension(
  file: File,
): string {
  const extension = file.name
    .split('.')
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (extension) {
    return extension;
  }

  return file.type.startsWith('image/')
    ? 'jpg'
    : 'mp3';
}

function imageMetadata(
  file: File,
): Promise<{
  width: number;
  height: number;
}> {
  return new Promise(
    (resolve, reject) => {
      const url =
        URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(url);

        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(
          new Error(
            'Invalid image.',
          ),
        );
      };

      image.src = url;
    },
  );
}

function audioMetadata(
  file: File,
): Promise<{
  durationMs: number;
}> {
  return new Promise(
    (resolve, reject) => {
      const url =
        URL.createObjectURL(file);
      const audio =
        document.createElement('audio');

      audio.preload = 'metadata';

      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);

        const durationMs =
          Math.round(
            audio.duration * 1000,
          );

        if (
          !Number.isFinite(durationMs) ||
          durationMs <= 0
        ) {
          reject(
            new Error(
              'Invalid audio.',
            ),
          );
          return;
        }

        resolve({ durationMs });
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(
          new Error(
            'Invalid audio.',
          ),
        );
      };

      audio.src = url;
    },
  );
}

export function SongMediaUpload({
  songId,
  kind,
  asset,
}: {
  songId: string;
  kind: SongMediaKind;
  asset: Asset | null;
}) {
  const router = useRouter();

  const [busy, setBusy] =
    useState(false);
  const [progress, setProgress] =
    useState(0);
  const [error, setError] =
    useState(false);

  const policy =
    SONG_MEDIA_POLICY[kind];

  const isCover = kind === 'cover';

  async function submit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form =
      event.currentTarget;
    const formData =
      new FormData(form);
    const file =
      formData.get('file');

    if (
      !(file instanceof File) ||
      file.size === 0
    ) {
      setError(true);
      return;
    }

    if (
      !(
        policy
          .allowedContentTypes as
          readonly string[]
      ).includes(file.type) ||
      file.size >
        policy.maximumSizeInBytes
    ) {
      setError(true);
      return;
    }

    setBusy(true);
    setError(false);
    setProgress(0);

    try {
      const metadata = isCover
        ? await imageMetadata(file)
        : await audioMetadata(file);

      const pathname =
        `songs/${songId}/${kind}-${crypto.randomUUID()}.${fileExtension(file)}`;

      const blob = await upload(
        pathname,
        file,
        {
          access: 'public',
          handleUploadUrl:
            '/api/admin/song-media/upload',
          clientPayload:
            JSON.stringify({
              songId,
              kind,
            }),
          multipart:
            kind === 'audio',
          onUploadProgress:
            ({ percentage }) => {
              setProgress(
                Math.round(percentage),
              );
            },
        },
      );

      const result =
        await registerSongMedia({
          songId,
          kind,
          url: blob.url,
          width:
            'width' in metadata
              ? metadata.width
              : null,
          height:
            'height' in metadata
              ? metadata.height
              : null,
          durationMs:
            'durationMs' in metadata
              ? metadata.durationMs
              : null,
        });

      if (!result.ok) {
        throw new Error(
          result.error ??
            'Registration failed.',
        );
      }

      form.reset();
      setProgress(100);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-[var(--radius-panel)] border border-[var(--line)] p-5">
      <h3 className="font-mono text-eyebrow uppercase text-[var(--text)]">
        {isCover
          ? admin.songs.coverArt
          : admin.songs.audioPreview}
      </h3>

      {asset ? (
        <div className="mt-4">
          {isCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.path}
              alt=""
              className="aspect-square w-full max-w-64 rounded-[var(--radius-panel)] object-cover"
            />
          ) : (
            <audio
              controls
              preload="metadata"
              src={asset.path}
              className="w-full"
            />
          )}

          <p className="mt-3 break-all font-mono text-[0.625rem] text-[var(--text-faint)]">
            {asset.path}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-body text-[var(--text-dim)]">
          {admin.songs.noMedia}
        </p>
      )}

      <form
        onSubmit={submit}
        className="mt-5 flex flex-col gap-4"
      >
        <input
          name="file"
          type="file"
          required
          accept={
            isCover
              ? 'image/jpeg,image/png,image/webp'
              : 'audio/mpeg,audio/mp4,audio/wav,audio/x-wav,audio/ogg'
          }
          className="block w-full font-mono text-xs text-[var(--text-dim)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--champagne)] file:px-4 file:py-2 file:font-ui file:text-xs file:font-medium file:uppercase file:text-[var(--ink)]"
        />

        {busy ? (
          <div>
            <div className="h-1 overflow-hidden rounded-full bg-[var(--line)]">
              <div
                className="h-full bg-[var(--champagne)] transition-[width]"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <p className="mt-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              {admin.songs.uploading}
              {' '}
              {progress}%
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="self-start rounded-full bg-[var(--champagne)] px-5 py-2.5 font-ui text-xs font-medium uppercase tracking-[0.04em] text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {asset
            ? admin.songs.replaceMedia
            : admin.songs.uploadMedia}
        </button>

        {error ? (
          <p
            className="font-mono text-eyebrow uppercase"
            style={{
              color: 'var(--ember)',
            }}
          >
            {admin.songs.uploadFailed}
          </p>
        ) : null}
      </form>
    </article>
  );
}
