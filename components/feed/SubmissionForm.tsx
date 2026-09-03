'use client';

import { useActionState } from 'react';
import { submitBrandFeedPost, type SubmissionState } from '@/lib/feed/submission-actions';

type SubmissionFormCopy = {
  typeLabel: string;
  typeText: string;
  typeImage: string;
  typeLink: string;
  titleLabel: string;
  bodyLabel: string;
  ctaLabelLabel: string;
  ctaUrlLabel: string;
  mediaLabel: string;
  mediaHint: string;
  rightsLabel: string;
  submit: string;
  successTitle: string;
  successBody: string;
  errorRightsRequired: string;
  errorUnsafeUrl: string;
  errorMediaType: string;
  errorMediaSize: string;
  errorMediaSignature: string;
  errorRateLimited: string;
  errorGeneric: string;
};

function errorMessage(error: string | undefined, copy: SubmissionFormCopy): string | null {
  switch (error) {
    case undefined:
      return null;
    case 'rights_required':
      return copy.errorRightsRequired;
    case 'unsafe_url':
      return copy.errorUnsafeUrl;
    case 'media_type':
      return copy.errorMediaType;
    case 'media_size':
      return copy.errorMediaSize;
    case 'media_signature':
      return copy.errorMediaSignature;
    case 'rate_limited':
      return copy.errorRateLimited;
    default:
      return copy.errorGeneric;
  }
}

export function SubmissionForm({ token, copy }: { token: string; copy: SubmissionFormCopy }) {
  const [state, formAction] = useActionState<SubmissionState, FormData>(submitBrandFeedPost, {});

  if (state.ok === 'submitted') {
    return (
      <div className="panel p-8 sm:p-10">
        <p className="font-display text-2xl uppercase text-[var(--text)]">{copy.successTitle}</p>
        <p className="mt-3 max-w-[52ch] text-body text-[var(--text-dim)]">{copy.successBody}</p>
      </div>
    );
  }

  const error = errorMessage(state.error, copy);

  return (
    <form action={formAction} encType="multipart/form-data" className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="token" value={token} />

      {/* Honeypot — hidden from real visitors via CSS, never via JS, so it
          still exists in the DOM for bots that don't render styles. */}
      <div aria-hidden className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label>
          Business website
          <input type="text" name="company_website_confirm" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {copy.typeLabel}
        </span>
        <select
          name="postType"
          defaultValue="text"
          className="w-full border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
        >
          <option value="text">{copy.typeText}</option>
          <option value="image">{copy.typeImage}</option>
          <option value="link">{copy.typeLink}</option>
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {copy.titleLabel}
        </span>
        <input
          name="title"
          className="w-full border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {copy.bodyLabel}
        </span>
        <textarea
          name="body"
          rows={6}
          className="w-full border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {copy.ctaLabelLabel}
        </span>
        <input
          name="ctaLabel"
          className="w-full border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {copy.ctaUrlLabel}
        </span>
        <input
          name="ctaUrl"
          type="url"
          className="w-full border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
          {copy.mediaLabel}
        </span>
        <input
          type="file"
          name="media"
          accept="image/png,image/webp,image/jpeg"
          className="w-full border border-[var(--line)] bg-transparent p-3 font-ui text-sm text-[var(--text)] focus:border-[var(--text)] focus:outline-none"
        />
        <span className="font-ui text-[0.625rem] uppercase tracking-[0.1em] text-[var(--text-dim)]">
          {copy.mediaHint}
        </span>
      </label>

      <label className="flex items-start gap-3 font-ui text-sm text-[var(--text-dim)]">
        <input type="checkbox" name="rightsAttested" required className="mt-1 h-4 w-4 accent-[var(--champagne)]" />
        {copy.rightsLabel}
      </label>

      <button type="submit" className="mj-button mj-button--primary w-fit">
        {copy.submit}
      </button>

      {error ? (
        <p className="font-ui text-sm" style={{ color: 'var(--ember)' }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
