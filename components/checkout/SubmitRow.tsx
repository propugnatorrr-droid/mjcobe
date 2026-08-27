'use client';

import { ArrowRight } from 'lucide-react';
import { useFormStatus } from 'react-dom';

export function SubmitRow({
  label,
  workingLabel,
  error,
}: {
  label: string;
  workingLabel: string;
  error?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          className={[
            'rounded-[var(--radius-panel)]',
            'border border-[rgba(198,93,98,0.5)]',
            'bg-[rgba(198,93,98,0.08)]',
            'px-4 py-3',
          ].join(' ')}
        >
          <p className="text-sm leading-6 text-[var(--status-danger)]">
            {error}
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        aria-disabled={pending}
        className={[
          'bg-gold',
          'inline-flex min-h-14 w-full items-center justify-center gap-3',
          'rounded-full px-8 py-4',
          'font-ui text-xs font-semibold uppercase tracking-[0.14em]',
          'text-[var(--ink)]',
          'transition-[filter,transform,opacity]',
          '[transition-duration:var(--duration-signature)]',
          '[transition-timing-function:var(--ease-signature)]',
          'hover:brightness-110 active:translate-y-px',
          'disabled:cursor-not-allowed disabled:opacity-50',
        ].join(' ')}
        style={{
          boxShadow: 'var(--glow-champagne)',
        }}
      >
        <span>{pending ? workingLabel : label}</span>
        <ArrowRight aria-hidden size={16} />
      </button>
    </div>
  );
}
