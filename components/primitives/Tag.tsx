export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-[2px] border border-[var(--line-strong)] px-2 py-1 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
      {children}
    </span>
  );
}
