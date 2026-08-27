import Link from 'next/link';

/** Wordmark-style streaming links. Deliberately typographic rather than
 * fetching each platform's real logo: those are trademarked assets with
 * their own usage rules, and a wrong-coloured Spotify glyph is worse than
 * a clean text link. Only renders services the song actually has a URL for. */
export function StreamingLinks({
  spotifyUrl,
  appleMusicUrl,
  youtubeUrl,
}: {
  spotifyUrl?: string | null;
  appleMusicUrl?: string | null;
  youtubeUrl?: string | null;
}) {
  const links = [
    { href: spotifyUrl, label: 'Spotify' },
    { href: appleMusicUrl, label: 'Apple Music' },
    { href: youtubeUrl, label: 'YouTube' },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href));

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {links.map((l) => (
        <Link
          key={l.label}
          href={l.href}
          className="font-ui text-xs tracking-[0.06em] text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--champagne)]"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
