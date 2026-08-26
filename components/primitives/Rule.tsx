export function Rule({ strong = false }: { strong?: boolean }) {
  return (
    <hr
      className={`h-px w-full border-0 ${strong ? 'bg-[var(--line-strong)]' : 'bg-[var(--line)]'}`}
    />
  );
}
