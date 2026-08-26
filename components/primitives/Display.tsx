export function Display({
  children,
  italic = false,
}: {
  children: React.ReactNode;
  italic?: boolean;
}) {
  return (
    <h2
      className={`font-display font-black text-display text-[var(--text)] ${italic ? 'italic' : ''}`}
    >
      {children}
    </h2>
  );
}
