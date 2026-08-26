export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
      {children}
    </span>
  );
}
