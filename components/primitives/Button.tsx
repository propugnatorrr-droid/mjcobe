import Link from 'next/link';

type Variant = 'primary' | 'ghost';

const BASE =
  'inline-flex items-center justify-center rounded-full px-7 py-3.5 font-ui text-sm font-medium uppercase tracking-[0.04em] transition-colors [transition-duration:var(--duration-signature)] [transition-timing-function:var(--ease-signature)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)] disabled:cursor-not-allowed disabled:opacity-40';

function variantClass(variant: Variant) {
  return variant === 'primary'
    ? 'bg-[var(--champagne)] text-[var(--ink)] hover:brightness-110'
    : 'border border-[var(--champagne)] text-[var(--champagne)] hover:bg-[var(--champagne)]/10';
}

type ButtonProps = {
  children: React.ReactNode;
  variant?: Variant;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  /** Capped glow — the primary hero CTA or the #1 slot only, never more than
   * one element per view. See docs/DESIGN.md's "Glow" section. */
  glow?: boolean;
};

export function Button({
  children,
  variant = 'primary',
  disabled = false,
  type = 'button',
  className = '',
  glow = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE} ${variantClass(variant)} ${className}`}
      style={glow ? { boxShadow: 'var(--glow-champagne)' } : undefined}
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
  glow = false,
}: Omit<ButtonProps, 'disabled' | 'type'> & { href: string }) {
  return (
    <Link
      href={href}
      className={`${BASE} ${variantClass(variant)} ${className}`}
      style={glow ? { boxShadow: 'var(--glow-champagne)' } : undefined}
    >
      {children}
    </Link>
  );
}
