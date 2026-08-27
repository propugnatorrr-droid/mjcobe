/** Section label flanked by the fading gold rule the mockups use. `align`
 * controls whether the rule runs to one side or both. */
export function SectionHeading({
  children,
  sub,
  align = 'left',
}: {
  children: React.ReactNode;
  sub?: string;
  align?: 'left' | 'center';
}) {
  if (align === 'center') {
    return (
      <div className="flex items-center gap-6">
        <span className="rule-gold h-px flex-1 opacity-60" />
        <h2 className="font-display text-2xl uppercase tracking-[0.12em] text-[var(--text)] md:text-3xl">
          {children}
        </h2>
        <span className="rule-gold h-px flex-1 opacity-60" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="flex shrink-0 items-baseline gap-4">
        <h2 className="font-display text-xl uppercase tracking-[0.12em] text-[var(--text)] md:text-2xl">
          {children}
        </h2>
        {sub ? (
          <span className="font-ui text-[0.625rem] uppercase tracking-[0.24em] text-[var(--champagne)]">
            {sub}
          </span>
        ) : null}
      </div>
      <span className="rule-gold h-px flex-1 opacity-50" />
    </div>
  );
}
