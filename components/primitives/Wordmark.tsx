import Link from 'next/link';

/** The serif MJ COBE lockup. `sub` renders the small tracked line beneath it
 * that the mockups use to label a section (MUSIC, PARTNERS, SONG JOURNEY). */
export function Wordmark({
  href = '/',
  sub,
  size = 'md',
}: {
  href?: string | null;
  sub?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const scale = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl';

  const inner = (
    <span className="flex flex-col items-center leading-none">
      <span className={`font-serif ${scale} tracking-[0.14em] text-gold`}>MJ COBE</span>
      {sub ? (
        <span className="mt-1.5 font-ui text-[0.5rem] uppercase tracking-[0.42em] text-[var(--text-dim)]">
          {sub}
        </span>
      ) : null}
    </span>
  );

  if (!href) return inner;
  return (
    <Link
      href={href}
      className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--champagne)]"
    >
      {inner}
    </Link>
  );
}
