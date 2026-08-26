'use client';

import { useFormStatus } from 'react-dom';

/** Pending state is a label change, not a spinner. */
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
        <p role="alert" className="text-body" style={{ color: 'var(--ember)' }}>
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full bg-[var(--champagne)] px-8 py-4 font-ui text-sm font-medium uppercase tracking-[0.04em] text-[var(--ink)] transition-colors [transition-duration:var(--duration-signature)] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)] disabled:cursor-not-allowed disabled:opacity-40"
        style={{ boxShadow: 'var(--glow-champagne)' }}
      >
        {pending ? workingLabel : label}
      </button>
    </div>
  );
}
