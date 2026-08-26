/** Framework-free validation so it can be unit tested without a request. */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function parseAmountCents(raw: unknown): number | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  // Round at the edge, once, so no float ever reaches the database.
  return Math.round(value * 100);
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
