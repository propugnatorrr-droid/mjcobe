/** Hairline-underline input. No boxes, no radius, no fill. */
export function Field({
  label,
  name,
  type = 'text',
  required = false,
  optionalLabel,
  placeholder,
  defaultValue,
  inputMode,
}: {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'url';
  required?: boolean;
  optionalLabel?: string;
  placeholder?: string;
  defaultValue?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'decimal';
}) {
  return (
    <label className="flex flex-col gap-3">
      <span className="flex items-baseline gap-3">
        <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {label}
        </span>
        {!required && optionalLabel ? (
          <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
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
        className="w-full border-b border-[var(--line)] bg-transparent pb-3 text-body text-[var(--text)] transition-colors [transition-duration:var(--duration-signature)] placeholder:text-[var(--text-dim)] focus:border-[var(--text)] focus:outline-none"
      />
    </label>
  );
}

export function CheckField({
  label,
  name,
  defaultChecked = false,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 shrink-0 appearance-none border border-[var(--line-strong)] bg-transparent transition-colors [transition-duration:var(--duration-signature)] checked:border-[var(--champagne)] checked:bg-[var(--champagne)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
      />
      <span className="text-body text-[var(--text-dim)]">{label}</span>
    </label>
  );
}
