import Link from 'next/link';

type Variant = 'primary' | 'ghost' | 'quiet';

const BASE = [
  'inline-flex min-h-12 items-center justify-center gap-2',
  'rounded-full px-7 py-3',
  'font-ui text-xs font-semibold uppercase tracking-[0.12em]',
  'transition-[color,background-color,border-color,filter,transform,box-shadow]',
  '[transition-duration:var(--duration-signature)]',
  '[transition-timing-function:var(--ease-signature)]',
  'focus-visible:outline focus-visible:outline-2',
  'focus-visible:outline-offset-2',
  'focus-visible:outline-[var(--champagne)]',
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40',
].join(' ');

function variantClass(variant: Variant) {
  switch (variant) {
    case 'primary':
      return [
        'bg-gold',
        'border border-transparent',
        'text-[var(--ink)]',
        'hover:brightness-110',
        'active:translate-y-px',
      ].join(' ');

    case 'quiet':
      return [
        'border border-[var(--line)]',
        'bg-[var(--ink-2)]',
        'text-[var(--text)]',
        'hover:border-[var(--line-strong)]',
        'hover:text-[var(--champagne)]',
        'active:translate-y-px',
      ].join(' ');

    case 'ghost':
    default:
      return [
        'border border-[var(--champagne)]',
        'bg-transparent',
        'text-[var(--champagne)]',
        'hover:bg-[rgba(201,162,39,0.09)]',
        'active:translate-y-px',
      ].join(' ');
  }
}

type ButtonProps = {
  children: React.ReactNode;
  variant?: Variant;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  glow?: boolean;
  name?: string;
  value?: string;
  form?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
};

export function Button({
  children,
  variant = 'primary',
  disabled = false,
  type = 'button',
  className = '',
  glow = false,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`${BASE} ${variantClass(variant)} ${className}`}
      style={glow ? { boxShadow: 'var(--glow-champagne)' } : undefined}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = {
  children: React.ReactNode;
  href: string;
  variant?: Variant;
  className?: string;
  glow?: boolean;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
  download?: boolean | string;
  'aria-label'?: string;
};

export function ButtonLink({
  children,
  href,
  variant = 'primary',
  className = '',
  glow = false,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      href={href}
      className={`${BASE} ${variantClass(variant)} ${className}`}
      style={glow ? { boxShadow: 'var(--glow-champagne)' } : undefined}
    >
      {children}
    </Link>
  );
}
