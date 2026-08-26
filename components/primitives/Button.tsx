export function Button({
  children,
  variant = 'primary',
  disabled = false,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
}) {
  const base =
    'rounded-[2px] px-6 py-3 font-ui text-sm uppercase tracking-[0.08em] transition-colors [transition-duration:var(--duration-signature)] [transition-timing-function:var(--ease-signature)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)] disabled:cursor-not-allowed disabled:opacity-40';

  const variantClass =
    variant === 'primary'
      ? 'bg-[var(--surface-invert)] text-[var(--surface-bg)] hover:bg-[var(--surface-invert-hover)]'
      : 'border border-[var(--line-strong)] text-[var(--text)] hover:border-[var(--text)]';

  return (
    <button className={`${base} ${variantClass}`} disabled={disabled}>
      {children}
    </button>
  );
}
