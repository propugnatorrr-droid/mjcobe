import Link from 'next/link';

type Variant = 'primary' | 'ghost';

const BASE =
  'inline-flex items-center justify-center rounded-[2px] px-6 py-3 font-ui text-sm uppercase tracking-[0.08em] transition-colors [transition-duration:var(--duration-signature)] [transition-timing-function:var(--ease-signature)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)] disabled:cursor-not-allowed disabled:opacity-40';

function variantClass(variant: Variant) {
  return variant === 'primary'
    ? 'bg-[var(--surface-invert)] text-[var(--surface-bg)] hover:bg-[var(--surface-invert-hover)]'
    : 'border border-[var(--line-strong)] text-[var(--text)] hover:border-[var(--text)]';
}

export function Button({
  children,
  variant = 'primary',
  disabled = false,
  type = 'button',
  className = '',
}: {
  children: React.ReactNode;
  variant?: Variant;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  return (
    <button
      type={type}
      className={`${BASE} ${variantClass(variant)} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

/**
 * Same visual object, real navigation. Kept separate from Button so a
 * disabled CTA can never render as a followable link.
 */
export function ButtonLink({
  children,
  href,
  variant = 'primary',
  className = '',
}: {
  children: React.ReactNode;
  href: string;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link href={href} className={`${BASE} ${variantClass(variant)} ${className}`}>
      {children}
    </Link>
  );
}
