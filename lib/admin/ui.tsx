/** Admin chrome. Same visual law as the public site: hairlines, mono, no fills. */

export function AdminHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="mb-2 font-mono text-eyebrow uppercase tracking-[0.18em] text-[var(--text-dim)]">
      {children}
    </h1>
  );
}

export function AdminHint({ children }: { children: React.ReactNode }) {
  return <p className="mb-10 max-w-[62ch] text-body text-[var(--text-dim)]">{children}</p>;
}

export function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-[var(--line)] pt-4">
      <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{label}</span>
      <span
        className="font-mono text-2xl md:text-3xl"
        style={{ color: accent ? 'var(--champagne)' : 'var(--text)' }}
      >
        {value}
      </span>
    </div>
  );
}

export function Table({
  head,
  children,
}: {
  head: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] border-collapse">
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="border-b border-[var(--line-strong)] py-3 pr-6 text-left font-mono text-eyebrow uppercase text-[var(--text-dim)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({
  children,
  mono = false,
  dim = false,
}: {
  children: React.ReactNode;
  mono?: boolean;
  dim?: boolean;
}) {
  return (
    <td
      className={`border-b border-[var(--line)] py-4 pr-6 align-top text-sm ${mono ? 'font-mono' : ''}`}
      style={{ color: dim ? 'var(--text-dim)' : 'var(--text)' }}
    >
      {children}
    </td>
  );
}

/** Inline submit inside a table cell. Text only, no button chrome. */
export function InlineAction({
  children,
  danger = false,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="submit"
      className="font-mono text-eyebrow uppercase transition-opacity [transition-duration:var(--duration-signature)] hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
      style={{ color: danger ? 'var(--ember)' : 'var(--text-dim)' }}
    >
      {children}
    </button>
  );
}

export function AdminInput({
  name,
  placeholder,
  defaultValue,
  type = 'text',
  wide = false,
}: {
  name: string;
  placeholder?: string;
  defaultValue?: string;
  type?: string;
  wide?: boolean;
}) {
  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      defaultValue={defaultValue}
      className={`${wide ? 'w-full' : 'w-40'} border-b border-[var(--line)] bg-transparent pb-1 font-mono text-sm text-[var(--text)] transition-colors [transition-duration:var(--duration-signature)] placeholder:text-[var(--text-faint)] focus:border-[var(--text)] focus:outline-none`}
    />
  );
}

export function AdminSelect({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="border-b border-[var(--line)] bg-[var(--ink)] pb-1 font-mono text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[var(--ink)]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function StateDot({ state }: { state: string }) {
  const color =
    state === 'settled'
      ? 'var(--champagne)'
      : state === 'refunded' || state === 'failed' || state === 'canceled'
        ? 'var(--ember)'
        : 'var(--text-faint)';
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 shrink-0" style={{ background: color }} />
      <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">{state}</span>
    </span>
  );
}
