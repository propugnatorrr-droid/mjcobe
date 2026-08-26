export function Tag({
  children,
  filled = false,
}: {
  children: React.ReactNode;
  filled?: boolean;
}) {
  return (
    <span
      className={
        filled
          ? 'inline-block rounded-full bg-[var(--champagne)] px-3 py-1 font-mono text-eyebrow uppercase text-[var(--ink)]'
          : 'inline-block rounded-full border border-[var(--line-strong)] px-3 py-1 font-mono text-eyebrow uppercase text-[var(--text-dim)]'
      }
    >
      {children}
    </span>
  );
}
