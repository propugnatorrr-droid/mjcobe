import Link from 'next/link';

type Variant = 'primary' | 'ghost' | 'quiet';

function classes(variant: Variant, className: string, glow: boolean) {
  return [
    'mj-button',
    `mj-button--${variant}`,
    glow ? 'mj-button--glow' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
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
      className={classes(variant, className, glow)}
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
  target?:
    React.HTMLAttributeAnchorTarget;
  rel?: string;
  download?:
    boolean | string;
  'aria-label'?: string;
  'data-analytics-kind'?:
    string;
  'data-analytics-source'?:
    string;
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
      className={classes(variant, className, glow)}
    >
      {children}
    </Link>
  );
}
