'use client';

import { useActionState } from 'react';
import { subscribeToNewsletter, type NewsletterState } from '@/lib/newsletter/actions';

export function NewsletterForm({
  placeholder,
  submitLabel,
  errorLabel,
  successLabel,
}: {
  placeholder: string;
  submitLabel: string;
  errorLabel: string;
  successLabel: string;
}) {
  const [state, action] = useActionState<NewsletterState, FormData>(subscribeToNewsletter, {});

  if (state.ok) {
    return (
      <p className="font-mono text-eyebrow uppercase text-[var(--champagne)]">{successLabel}</p>
    );
  }

  return (
<form
  action={action}
  className="now-v4-newsletter flex flex-col gap-3 sm:flex-row"
>
      <input
        type="email"
        name="email"
        required
        placeholder={placeholder}
        className="w-full flex-1 rounded-full border bg-transparent px-5 py-3 font-ui text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        style={{ borderColor: 'var(--line)' }}
      />
      <button
        type="submit"
        className="rounded-full bg-[var(--champagne)] px-6 py-3 font-ui text-sm font-medium uppercase tracking-[0.04em] text-[var(--ink)] transition-colors [transition-duration:var(--duration-signature)] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
      >
        {submitLabel}
      </button>
      {state.error ? (
        <span className="self-center font-mono text-eyebrow uppercase" style={{ color: 'var(--ember)' }}>
          {errorLabel}
        </span>
      ) : null}
    </form>
  );
}
