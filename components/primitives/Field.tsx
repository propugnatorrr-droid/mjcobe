export function Field({
  label,
  name,
  type = 'text',
  required = false,
  optionalLabel,
  placeholder,
  defaultValue,
  inputMode,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'url';
  required?: boolean;
  optionalLabel?: string;
  placeholder?: string;
  defaultValue?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'decimal';
  autoComplete?: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2.5">
      <span className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-ui text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-dim)]">
          {label}
        </span>

        {!required && optionalLabel ? (
          <span className="font-ui text-[0.5625rem] uppercase tracking-[0.14em] text-[var(--text-faint)]">
            {optionalLabel}
          </span>
        ) : null}
      </span>

      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className={[
          'min-h-13 w-full rounded-[var(--radius-panel)]',
          'border border-[var(--line)]',
          'bg-[var(--field-bg)] px-4 py-3',
          'font-ui text-base text-[var(--text)]',
          'transition-[border-color,background-color,box-shadow]',
          '[transition-duration:var(--duration-signature)]',
          '[transition-timing-function:var(--ease-signature)]',
          'placeholder:text-[var(--text-faint)]',
          'hover:border-[var(--line-strong)]',
          'focus:border-[var(--champagne)]',
          'focus:bg-[var(--ink-2)]',
          'focus:outline-none',
          'focus:ring-2 focus:ring-[rgba(201,162,39,0.16)]',
        ].join(' ')}
      />
    </label>
  );
}

export function CheckField({
  label,
  name,
  defaultChecked = false,
  required = false,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  required?: boolean;
}) {
  return (
    <label
      className={[
        'flex cursor-pointer items-start gap-3',
        'rounded-[var(--radius-panel)]',
        'border border-[var(--line)]',
        'bg-[var(--field-bg)] px-4 py-3.5',
        'transition-colors',
        '[transition-duration:var(--duration-signature)]',
        'hover:border-[var(--line-strong)]',
      ].join(' ')}
    >
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        required={required}
        className={[
          'mt-0.5 h-5 w-5 shrink-0',
          'cursor-pointer rounded',
          'accent-[var(--champagne)]',
          'focus-visible:outline focus-visible:outline-2',
          'focus-visible:outline-offset-2',
          'focus-visible:outline-[var(--champagne)]',
        ].join(' ')}
      />

      <span className="text-sm leading-6 text-[var(--text-dim)]">
        {label}
      </span>
    </label>
  );
}
