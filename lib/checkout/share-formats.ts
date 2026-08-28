export const SHARE_FORMATS = {
  story: {
    key: 'story',
    width: 1080,
    height: 1920,
    filenameSuffix: 'story',
  },
  feed: {
    key: 'feed',
    width: 1080,
    height: 1350,
    filenameSuffix: 'feed',
  },
  x: {
    key: 'x',
    width: 1200,
    height: 675,
    filenameSuffix: 'x',
  },
} as const;

export type ShareFormat =
  keyof typeof SHARE_FORMATS;

export function parseShareFormat(
  value: string,
): ShareFormat | null {
  if (
    Object.prototype.hasOwnProperty.call(
      SHARE_FORMATS,
      value,
    )
  ) {
    return value as ShareFormat;
  }

  return null;
}
