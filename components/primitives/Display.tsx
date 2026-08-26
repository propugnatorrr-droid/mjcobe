export function Display({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-display text-[var(--text)]">
      {children}
    </h2>
  );
}
