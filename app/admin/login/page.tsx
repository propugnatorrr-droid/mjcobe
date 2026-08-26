'use client';

import { useActionState } from 'react';
import { signIn, type AdminState } from '@/lib/admin/actions';
import { admin } from '@/lib/copy/admin';
import { Field } from '@/components/primitives/Field';

export default function AdminLoginPage() {
  const [state, action] = useActionState<AdminState, FormData>(signIn, {});

  return (
    <main className="surface-ink flex min-h-screen items-center px-6 md:px-12">
      <form action={action} className="mx-auto w-full max-w-sm">
        <h1 className="mb-16 font-mono text-eyebrow uppercase tracking-[0.18em] text-[var(--text-dim)]">
          {admin.brand}
        </h1>

        <div className="flex flex-col gap-10">
          <Field label={admin.email} name="email" type="email" required inputMode="email" />
          <label className="flex flex-col gap-3">
            <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
              {admin.password}
            </span>
            <input
              name="password"
              type="password"
              required
              className="w-full border-b border-[var(--line)] bg-transparent pb-3 text-body text-[var(--text)] transition-colors [transition-duration:var(--duration-signature)] focus:border-[var(--text)] focus:outline-none"
            />
          </label>
        </div>

        {state.error ? (
          <p role="alert" className="mt-8 text-body" style={{ color: 'var(--ember)' }}>
            {admin.authFailed}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-12 w-full rounded-full bg-[var(--champagne)] px-6 py-4 font-ui text-sm font-medium uppercase tracking-[0.04em] text-[var(--ink)] transition-colors [transition-duration:var(--duration-signature)] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {admin.signIn}
        </button>
      </form>
    </main>
  );
}
