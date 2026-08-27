'use client';

import { useState } from 'react';
import { Star, Zap, Target, Crown, Gem, Trophy, Check, type LucideIcon } from 'lucide-react';

export type AmountOption = {
  id: string;
  label: string;
  amountLabel: string;
  amountCents: number;
  note?: string | null;
  disabled?: boolean;
  /** Full benefit/deliverable list for the selection summary. */
  benefits?: string[];
  /** Maps to a plain stroke icon; unknown keys fall back to Star. */
  iconKey?: string | null;
};

const ICONS: Record<string, LucideIcon> = {
  supporter: Star,
  day_one: Zap,
  inner_circle: Target,
  gold: Crown,
  founding: Gem,
  executive: Trophy,
  digital: Target,
  featured: Star,
  visual: Zap,
  presenting: Crown,
};

function iconFor(key?: string | null): LucideIcon {
  if (key && ICONS[key]) return ICONS[key];
  return Star;
}

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
  selectedId,
  onSelect,
  showSummary = true,
}: {
  options: AmountOption[];
  /** 'tierId' for fans, 'packageId' for sponsors. */
  fieldName: string;
  customLabel: string;
  customPlaceholder: string;
  currencySymbol: string;
  /** Controlled mode: the parent owns the selection so a sidebar can mirror
   * it. Uncontrolled (both omitted) keeps the standalone behaviour. */
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  /** Off when the parent renders its own selection summary. */
  showSummary?: boolean;
}) {
  const [ownSelected, setOwnSelected] = useState<string | null>(options[0]?.id ?? null);
  const controlled = onSelect !== undefined;
  const selected = controlled ? (selectedId ?? null) : ownSelected;
  const setSelected = (id: string | null) => {
    if (controlled) onSelect(id);
    else setOwnSelected(id);
  };
  const isCustom = selected === null;
  const activeOption = options.find((o) => o.id === selected) ?? null;

  return (
    <div className="flex flex-col gap-8">
      <input type="hidden" name={fieldName} value={isCustom ? '' : selected} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {options.map((option) => {
          const active = option.id === selected;
          const Icon = iconFor(option.iconKey);
          return (
            <button
              key={option.id}
              type="button"
              disabled={option.disabled}
              onClick={() => setSelected(option.id)}
              aria-pressed={active}
              className="flex flex-col items-center gap-2 rounded-[var(--radius-panel)] border p-5 text-center transition-colors [transition-duration:var(--duration-signature)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
              style={{
                borderColor: active ? 'var(--champagne)' : 'var(--line)',
                background: 'var(--ink-2)',
                boxShadow: active ? 'var(--glow-champagne)' : undefined,
              }}
            >
              <span className="font-mono text-xl text-[var(--text)]">{option.amountLabel}</span>
              <Icon aria-hidden size={18} color={active ? 'var(--champagne)' : 'var(--text-dim)'} />
              <span
                className="text-xs uppercase tracking-[0.06em]"
                style={{ color: active ? 'var(--champagne)' : 'var(--text-dim)' }}
              >
                {option.label}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setSelected(null)}
          aria-pressed={isCustom}
          className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-panel)] border p-5 text-center transition-colors [transition-duration:var(--duration-signature)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
          style={{
            borderColor: isCustom ? 'var(--champagne)' : 'var(--line)',
            background: 'var(--ink-2)',
            boxShadow: isCustom ? 'var(--glow-champagne)' : undefined,
          }}
        >
          <span
            className="text-xs uppercase tracking-[0.06em]"
            style={{ color: isCustom ? 'var(--champagne)' : 'var(--text-dim)' }}
          >
            {customLabel}
          </span>
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
      ) : showSummary && activeOption?.benefits?.length ? (
        <div
          className="rounded-[var(--radius-panel)] border p-6"
          style={{ borderColor: 'var(--champagne)', background: 'var(--ink-2)' }}
        >
          <p className="font-mono text-eyebrow uppercase text-[var(--champagne)]">
            {activeOption.label} · {activeOption.amountLabel}
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {activeOption.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-body text-[var(--text-dim)]">
                <Check aria-hidden size={16} color="var(--champagne)" className="mt-1 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
