import type { ReactNode } from 'react';

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

export function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="border-t border-[var(--line-strong)] pt-4">
      <span className="font-mono text-eyebrow uppercase text-[var(--text-faint)]">
        {label}
      </span>
      <p className="mt-3 font-mono text-2xl tabular-nums text-[var(--text)]">
        {value}
      </p>
      {note ? (
        <p className="mt-2 font-mono text-eyebrow uppercase text-[var(--text-faint)]">
          {note}
        </p>
      ) : null}
    </div>
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
    <div className="overflow-x-auto border-t border-[var(--line-strong)]">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                scope="col"
                className="whitespace-nowrap border-b border-[var(--line)] py-3 pr-8 font-mono text-eyebrow font-normal uppercase text-[var(--text-faint)]"
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
        'border-b border-[var(--line)] py-4 pr-8 align-top',
        mono ? 'font-mono text-sm tabular-nums' : 'text-body',
        dim ? 'text-[var(--text-dim)]' : 'text-[var(--text)]',
        nowrap ? 'whitespace-nowrap' : '',
      ].join(' ')}
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
