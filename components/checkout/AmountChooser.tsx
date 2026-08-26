'use client';

import { useState } from 'react';

export type AmountOption = {
  id: string;
  label: string;
  amountLabel: string;
  amountCents: number;
  note?: string | null;
  disabled?: boolean;
};

/**
 * Presets write a hidden id; "other" clears it and reveals a free field. The
 * server re-reads the preset's price from the database either way, so a
 * tampered form cannot buy a $250 tier for $1.
 */
export function AmountChooser({
  options,
  fieldName,
  customLabel,
  customPlaceholder,
  currencySymbol,
}: {
  options: AmountOption[];
  /** 'tierId' for fans, 'packageId' for sponsors. */
  fieldName: string;
  customLabel: string;
  customPlaceholder: string;
  currencySymbol: string;
}) {
  const [selected, setSelected] = useState<string | null>(options[0]?.id ?? null);
  const isCustom = selected === null;

  return (
    <div className="flex flex-col gap-8">
      <input type="hidden" name={fieldName} value={isCustom ? '' : selected} />

      <div className="border-t border-[var(--line)]">
        {options.map((option) => {
          const active = option.id === selected;
          return (
            <button
              key={option.id}
              type="button"
              disabled={option.disabled}
              onClick={() => setSelected(option.id)}
              aria-pressed={active}
              className="flex w-full items-center justify-between gap-6 border-b border-[var(--line)] py-6 text-left transition-opacity [transition-duration:var(--duration-signature)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
            >
              <span className="flex min-w-0 items-baseline gap-4">
                <span
                  className="h-1.5 w-1.5 shrink-0"
                  style={{ background: active ? 'var(--ember)' : 'var(--line-strong)' }}
                />
                <span className="truncate uppercase tracking-[0.06em] text-[var(--text)]">
                  {option.label}
                </span>
                {option.note ? (
                  <span className="hidden font-mono text-eyebrow uppercase text-[var(--text-dim)] sm:inline">
                    {option.note}
                  </span>
                ) : null}
              </span>
              <span className="font-mono whitespace-nowrap text-[var(--text)]">
                {option.amountLabel}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setSelected(null)}
          aria-pressed={isCustom}
          className="flex w-full items-center gap-4 border-b border-[var(--line)] py-6 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          <span
            className="h-1.5 w-1.5 shrink-0"
            style={{ background: isCustom ? 'var(--ember)' : 'var(--line-strong)' }}
          />
          <span className="uppercase tracking-[0.06em] text-[var(--text)]">{customLabel}</span>
        </button>
      </div>

      {isCustom ? (
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-2xl text-[var(--text-dim)]">{currencySymbol}</span>
          <input
            name="amount"
            inputMode="decimal"
            autoFocus
            placeholder={customPlaceholder}
            className="font-mono w-full border-b border-[var(--line)] bg-transparent pb-3 text-2xl text-[var(--text)] transition-colors [transition-duration:var(--duration-signature)] placeholder:text-[var(--text-dim)] focus:border-[var(--text)] focus:outline-none"
          />
        </div>
      ) : null}
    </div>
  );
}
