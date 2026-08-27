'use client';

import { useState } from 'react';
import {
  Check,
  Crown,
  Gem,
  Star,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type AmountOption = {
  id: string;
  label: string;
  amountLabel: string;
  amountCents: number;
  note?: string | null;
  disabled?: boolean;
  benefits?: string[];
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
  if (key && ICONS[key]) {
    return ICONS[key];
  }

  return Star;
}

function firstAvailableId(options: AmountOption[]) {
  return options.find((option) => !option.disabled)?.id ?? null;
}

export function AmountChooser({
  options,
  fieldName,
  customLabel,
  customPlaceholder,
  currencySymbol,
  selectedId,
  onSelect,
  onCustomAmountChange,
  showSummary = true,
}: {
  options: AmountOption[];
  fieldName: string;
  customLabel: string;
  customPlaceholder: string;
  currencySymbol: string;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onCustomAmountChange?: (amount: string) => void;
  showSummary?: boolean;
}) {
  const [ownSelected, setOwnSelected] = useState<string | null>(
    firstAvailableId(options),
  );

  const controlled = onSelect !== undefined;
  const selected = controlled
    ? selectedId ?? null
    : ownSelected;

  const activeOption =
    options.find((option) => option.id === selected) ?? null;

  const isCustom = selected === null;

  function setSelected(id: string | null) {
    if (controlled) {
      onSelect(id);
      return;
    }

    setOwnSelected(id);
  }

  return (
    <div className="flex flex-col gap-6">
      <input
        type="hidden"
        name={fieldName}
        value={isCustom ? '' : selected ?? ''}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
              className={[
                'relative flex min-h-28 items-center gap-4',
                'rounded-[var(--radius-panel)] border',
                'p-4 text-left',
                'transition-[border-color,background-color,color,box-shadow]',
                '[transition-duration:var(--duration-signature)]',
                '[transition-timing-function:var(--ease-signature)]',
                'disabled:cursor-not-allowed disabled:opacity-40',
              ].join(' ')}
              style={{
                borderColor: active
                  ? 'var(--champagne)'
                  : 'var(--line)',
                background: active
                  ? 'rgba(201, 162, 39, 0.055)'
                  : 'var(--ink-2)',
                boxShadow: active
                  ? '0 0 24px rgba(201, 162, 39, 0.12)'
                  : undefined,
              }}
            >
              <span
                className={[
                  'flex h-11 w-11 shrink-0 items-center justify-center',
                  'rounded-full border',
                ].join(' ')}
                style={{
                  borderColor: active
                    ? 'var(--champagne)'
                    : 'var(--line)',
                  background: active
                    ? 'rgba(201, 162, 39, 0.12)'
                    : 'var(--ink)',
                }}
              >
                <Icon
                  aria-hidden
                  size={19}
                  strokeWidth={1.8}
                  color={
                    active
                      ? 'var(--champagne)'
                      : 'var(--text-dim)'
                  }
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="numeric block font-serif text-2xl leading-none text-[var(--text)]">
                  {option.amountLabel}
                </span>

                <span
                  className="mt-2 block text-[0.625rem] font-semibold uppercase tracking-[0.12em]"
                  style={{
                    color: active
                      ? 'var(--champagne)'
                      : 'var(--text-dim)',
                  }}
                >
                  {option.label}
                </span>
              </span>

              {active ? (
                <span
                  aria-hidden
                  className={[
                    'absolute right-3 top-3',
                    'flex h-5 w-5 items-center justify-center',
                    'rounded-full bg-[var(--champagne)]',
                  ].join(' ')}
                >
                  <Check
                    size={12}
                    strokeWidth={2.5}
                    color="var(--ink)"
                  />
                </span>
              ) : null}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setSelected(null)}
          aria-pressed={isCustom}
          className={[
            'relative flex min-h-28 items-center gap-4',
            'rounded-[var(--radius-panel)] border',
            'p-4 text-left',
            'transition-[border-color,background-color,color,box-shadow]',
            '[transition-duration:var(--duration-signature)]',
            '[transition-timing-function:var(--ease-signature)]',
          ].join(' ')}
          style={{
            borderColor: isCustom
              ? 'var(--champagne)'
              : 'var(--line)',
            background: isCustom
              ? 'rgba(201, 162, 39, 0.055)'
              : 'var(--ink-2)',
            boxShadow: isCustom
              ? '0 0 24px rgba(201, 162, 39, 0.12)'
              : undefined,
          }}
        >
          <span
            className={[
              'flex h-11 w-11 shrink-0 items-center justify-center',
              'rounded-full border',
            ].join(' ')}
            style={{
              borderColor: isCustom
                ? 'var(--champagne)'
                : 'var(--line)',
              background: isCustom
                ? 'rgba(201, 162, 39, 0.12)'
                : 'var(--ink)',
            }}
          >
            <Star
              aria-hidden
              size={19}
              strokeWidth={1.8}
              color={
                isCustom
                  ? 'var(--champagne)'
                  : 'var(--text-dim)'
              }
            />
          </span>

          <span
            className="text-[0.625rem] font-semibold uppercase tracking-[0.12em]"
            style={{
              color: isCustom
                ? 'var(--champagne)'
                : 'var(--text-dim)',
            }}
          >
            {customLabel}
          </span>

          {isCustom ? (
            <span
              aria-hidden
              className={[
                'absolute right-3 top-3',
                'flex h-5 w-5 items-center justify-center',
                'rounded-full bg-[var(--champagne)]',
              ].join(' ')}
            >
              <Check
                size={12}
                strokeWidth={2.5}
                color="var(--ink)"
              />
            </span>
          ) : null}
        </button>
      </div>

      {isCustom ? (
        <label className="flex flex-col gap-2.5">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-dim)]">
            {customLabel}
          </span>

          <span
            className={[
              'flex min-h-14 items-center gap-3',
              'rounded-[var(--radius-panel)]',
              'border border-[var(--line)]',
              'bg-[var(--field-bg)] px-4',
              'focus-within:border-[var(--champagne)]',
              'focus-within:ring-2',
              'focus-within:ring-[rgba(201,162,39,0.16)]',
            ].join(' ')}
          >
            <span className="numeric shrink-0 font-serif text-2xl text-[var(--text-dim)]">
              {currencySymbol}
            </span>

            <input
              name="amount"
              inputMode="decimal"
              required
              placeholder={customPlaceholder}
              onChange={(event) => {
                onCustomAmountChange?.(event.currentTarget.value);
              }}
              className={[
                'min-w-0 flex-1 bg-transparent py-3',
                'numeric font-serif text-2xl text-[var(--text)]',
                'placeholder:text-[var(--text-faint)]',
                'focus:outline-none',
              ].join(' ')}
            />
          </span>
        </label>
      ) : showSummary && activeOption?.benefits?.length ? (
        <div
          className={[
            'rounded-[var(--radius-panel)]',
            'border border-[rgba(201,162,39,0.48)]',
            'bg-[rgba(201,162,39,0.04)] p-6',
          ].join(' ')}
        >
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--champagne)]">
            {activeOption.label}
            <span
              aria-hidden
              className="mx-2 text-[var(--line-strong)]"
            >
              /
            </span>
            <span className="numeric">
              {activeOption.amountLabel}
            </span>
          </p>

          <ul className="mt-4 flex flex-col gap-3">
            {activeOption.benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-3 text-sm leading-6 text-[var(--text-dim)]"
              >
                <Check
                  aria-hidden
                  size={15}
                  color="var(--champagne)"
                  className="mt-1 shrink-0"
                />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
