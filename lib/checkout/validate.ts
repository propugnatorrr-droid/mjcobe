/** Framework-free validation so it can be unit tested without a request. */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function parseAmountCents(
  raw: unknown,
): number | null {
  if (
    typeof raw !== 'string'
  ) {
    return null;
  }

  const value = raw.trim();

  /*
   * Accept only a plain positive decimal
   * with no more than two fractional digits.
   *
   * Do not strip characters: doing so would
   * turn "-50" into "50" or "$25" into "25".
   */
  if (
    !/^(?:\d+|\d+\.\d{1,2}|\.\d{1,2})$/.test(
      value,
    )
  ) {
    return null;
  }

  const [whole = '0', fraction = ''] =
    value.split('.');

  const cents =
    Number(whole) * 100 +
    Number(
      fraction.padEnd(2, '0'),
    );

  if (
    !Number.isSafeInteger(cents) ||
    cents <= 0
  ) {
    return null;
  }

  return cents;
}


export function str(raw: unknown, max = 200): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed.slice(0, max);
}

export function bool(raw: unknown): boolean {
  return raw === 'on' || raw === 'true' || raw === '1';
}

/** Instagram handles are stored bare, without @ or URL wrapper. */
export function normalizeHandle(raw: string | null): string | null {
  if (!raw) return null;
  return raw.replace(/^@+/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '');
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}
