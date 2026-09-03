/**
 * A brand feed post's CTA URL is submitted content, not admin-authored
 * config — it must never be trusted at face value. Only https: URLs are
 * ever stored; everything else (javascript:, data:, bare mailto typos,
 * malformed input) is rejected outright rather than "sanitized" into
 * something that looks safe.
 */
export function normalizeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:') return null;

  return parsed.toString();
}
