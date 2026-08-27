import type { ReactNode, ComponentType } from 'react';

type IconType = ComponentType<{ size?: number; color?: string; 'aria-hidden'?: boolean }>;

export function AdminHeading({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-mono text-eyebrow uppercase tracking-[0.14em] text-[var(--text)]">
      {children}
    </h1>
  );
}

export function AdminHint({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 mb-10 max-w-[62ch] text-body text-[var(--text-dim)]">
      {children}
    </p>
  );
}

function MetricShell({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: IconType;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-[var(--radius-panel)] border p-5"
      style={{ borderColor: 'var(--line)', background: 'var(--ink-2)' }}
    >
      <span className="flex items-center gap-3 font-ui text-[0.625rem] uppercase tracking-[0.18em] text-[var(--text-dim)]">
        {Icon ? (
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ outline: '1px solid var(--champagne)' }}
          >
            <Icon size={15} color="var(--champagne)" />
          </span>
        ) : null}
        {label}
      </span>
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note?: string;
  icon?: IconType;
}) {
  return (
    <MetricShell label={label} icon={icon}>
      <p className="mt-3 font-serif text-3xl tabular-nums text-gold">{value}</p>
      {note ? (
        <p className="mt-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {note}
        </p>
      ) : null}
    </MetricShell>
  );
}

export function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: IconType;
}) {
  return (
    <MetricShell label={label} icon={icon}>
      <span className="mt-3 block font-serif text-3xl tabular-nums text-gold md:text-4xl">
        {value}
      </span>
    </MetricShell>
  );
}

export function Table({
  head,
  children,
}: {
  head: string[];
  children: ReactNode;
}) {
  return (
    <div
      className="overflow-x-auto rounded-[var(--radius-panel)] border"
      style={{ borderColor: 'var(--line)' }}
    >
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                scope="col"
                className="whitespace-nowrap border-b px-5 py-3 font-mono text-eyebrow font-normal uppercase text-[var(--text-dim)]"
                style={{ borderColor: 'var(--line)' }}
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
  nowrap = false,
}: {
  children: ReactNode;
  mono?: boolean;
  dim?: boolean;
  nowrap?: boolean;
}) {
  return (
    <td
      className={[
        'border-b px-5 py-4 align-top',
        mono ? 'font-mono text-sm tabular-nums' : 'text-body',
        dim ? 'text-[var(--text-dim)]' : 'text-[var(--text)]',
        nowrap ? 'whitespace-nowrap' : '',
      ].join(' ')}
      style={{ borderColor: 'var(--line)' }}
    >
      {children}
    </td>
  );
}

export function InlineAction({
  children,
  danger = false,
}: {
  children: ReactNode;
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
      className={`${wide ? 'w-full' : 'w-40'} border-b border-[var(--line)] bg-transparent pb-1 font-mono text-sm text-[var(--text)] transition-colors [transition-duration:var(--duration-signature)] placeholder:text-[var(--text-dim)] focus:border-[var(--text)] focus:outline-none`}
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
    state === 'settled' ? 'var(--champagne)'
    : state === 'refunded' || state === 'failed' ? 'var(--ember)'
    : 'var(--text-faint)';

  return (
    <span className="inline-flex items-center gap-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
      <span
        aria-hidden
        className="inline-block h-[6px] w-[6px] rounded-full"
        style={{ background: color }}
      />
      {state}
    </span>
  );
}
