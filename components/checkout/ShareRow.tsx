'use client';

import { useState } from 'react';

/** Share graphic plus a copy-link control. No icons, no emoji. */
export function ShareRow({
  shareUrlPath,
  imagePath,
  copyLabel,
  copiedLabel,
  downloadLabel,
}: {
  shareUrlPath: string;
  imagePath: string;
  copyLabel: string;
  copiedLabel: string;
  downloadLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${shareUrlPath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the link is visible in the address bar anyway.
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Intrinsic size declared so the card cannot shift layout as it loads. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagePath}
        alt=""
        width={1200}
        height={630}
        className="w-full border border-[var(--line)]"
      />

      <div className="flex flex-wrap gap-6">
        <button
          type="button"
          onClick={copy}
          className="font-mono text-eyebrow uppercase text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {copied ? copiedLabel : copyLabel}
        </button>
        <a
          href={imagePath}
          download
          className="font-mono text-eyebrow uppercase text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {downloadLabel}
        </a>
      </div>
    </div>
  );
}
