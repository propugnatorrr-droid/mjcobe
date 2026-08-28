export const SONG_MEDIA_KINDS = [
  'cover',
  'audio',
] as const;

export type SongMediaKind =
  (typeof SONG_MEDIA_KINDS)[number];

export const SONG_MEDIA_POLICY = {
  cover: {
    maximumSizeInBytes:
      10 * 1024 * 1024,
    allowedContentTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
  },
  audio: {
    maximumSizeInBytes:
      100 * 1024 * 1024,
    allowedContentTypes: [
      'audio/mpeg',
      'audio/mp4',
      'audio/wav',
      'audio/x-wav',
      'audio/ogg',
    ],
  },
} as const;

export function isSongMediaKind(
  value: unknown,
): value is SongMediaKind {
  return (
    typeof value === 'string' &&
    SONG_MEDIA_KINDS.some(
      (kind) => kind === value,
    )
  );
}

export function contentTypeAllowed(
  kind: SongMediaKind,
  contentType: string,
): boolean {
  return (
    SONG_MEDIA_POLICY[
      kind
    ].allowedContentTypes as readonly string[]
  ).includes(contentType);
}
