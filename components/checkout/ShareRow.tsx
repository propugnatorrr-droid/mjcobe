'use client';

import {
  useState,
} from 'react';
import {
  SHARE_FORMATS,
  type ShareFormat,
} from '@/lib/checkout/share-formats';

export type ShareRowLabels = {
  heading: string;
  story: string;
  feed: string;
  x: string;
  share: string;
  sharing: string;
  download: string;
  copy: string;
  copied: string;
  previewAlt: string;
  shareTitle: string;
  shareText: string;
};

type Props = {
  token: string;
  shareUrlPath: string;
  labels: ShareRowLabels;
};

const FORMAT_ORDER: ShareFormat[] = [
  'story',
  'feed',
  'x',
];

function fileName(
  format: ShareFormat,
): string {
  return `mjcobe-support-${format}.png`;
}

export function ShareRow({
  token,
  shareUrlPath,
  labels,
}: Props) {
  const [
    selected,
    setSelected,
  ] = useState<ShareFormat>(
    'story',
  );

  const [
    copied,
    setCopied,
  ] = useState(false);

  const [
    sharing,
    setSharing,
  ] = useState(false);

  const [
    downloading,
    setDownloading,
  ] = useState(false);

  const format =
    SHARE_FORMATS[selected];

  const imagePath =
    `/api/share/thanks/${token}/${selected}`;

  function absoluteUrl(
    value: string,
  ): string {
    return new URL(
      value,
      window.location.origin,
    ).toString();
  }

  async function loadImageFile() {
    const response = await fetch(
      imagePath,
      {
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      throw new Error(
        'Share image unavailable',
      );
    }

    const blob =
      await response.blob();

    return new File(
      [blob],
      fileName(selected),
      {
        type:
          blob.type ||
          'image/png',
      },
    );
  }

  async function downloadSelected() {
    if (downloading) {
      return;
    }

    setDownloading(true);

    try {
      const file =
        await loadImageFile();

      const objectUrl =
        URL.createObjectURL(file);

      const anchor =
        document.createElement('a');

      anchor.href = objectUrl;
      anchor.download = file.name;

      document.body.appendChild(
        anchor,
      );

      anchor.click();
      anchor.remove();

      window.setTimeout(
        () =>
          URL.revokeObjectURL(
            objectUrl,
          ),
        1000,
      );
    } catch {
      window.location.assign(
        imagePath,
      );
    } finally {
      setDownloading(false);
    }
  }

  async function copyLink() {
    const url =
      absoluteUrl(shareUrlPath);

    try {
      await navigator.clipboard.writeText(
        url,
      );
    } catch {
      const field =
        document.createElement(
          'textarea',
        );

      field.value = url;
      field.setAttribute(
        'readonly',
        '',
      );

      field.style.position =
        'fixed';
      field.style.opacity = '0';

      document.body.appendChild(
        field,
      );

      field.select();
      document.execCommand('copy');
      field.remove();
    }

    setCopied(true);

    window.setTimeout(
      () => setCopied(false),
      2000,
    );
  }

  async function shareSelected() {
    if (sharing) {
      return;
    }

    setSharing(true);

    try {
      if (
        typeof navigator.share !==
        'function'
      ) {
        await downloadSelected();
        return;
      }

      const file =
        await loadImageFile();

      const canShareFile =
        typeof navigator.canShare ===
          'function' &&
        navigator.canShare({
          files: [file],
        });

      if (!canShareFile) {
        await downloadSelected();
        return;
      }

      await navigator.share({
        files: [file],
        title: labels.shareTitle,
        text: `${
          labels.shareText
        } ${absoluteUrl(
          shareUrlPath,
        )}`,
      });
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === 'AbortError'
      ) {
        return;
      }

      await downloadSelected();
    } finally {
      setSharing(false);
    }
  }

  return (
    <section
      aria-labelledby="share-heading"
      className="flex flex-col gap-8"
    >
      <h2
        id="share-heading"
        className="font-ui text-xs uppercase tracking-[0.24em] text-[var(--text)]"
      >
        {labels.heading}
      </h2>

      <div
        role="group"
        aria-label={labels.heading}
        className="flex flex-wrap justify-center gap-2"
      >
        {FORMAT_ORDER.map(
          (formatKey) => {
            const active =
              selected ===
              formatKey;

            const label =
              formatKey === 'story'
                ? labels.story
                : formatKey ===
                    'feed'
                  ? labels.feed
                  : labels.x;

            return (
              <button
                key={formatKey}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setSelected(
                    formatKey,
                  )
                }
                className={`rounded-sm border px-5 py-3 font-mono text-[0.625rem] uppercase tracking-[0.18em] transition-colors [transition-duration:var(--duration-signature)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)] ${
                  active
                    ? 'border-[var(--champagne)] bg-[var(--champagne)] text-[var(--ink)]'
                    : 'border-[var(--line)] text-[var(--text-dim)] hover:border-[var(--champagne)] hover:text-[var(--text)]'
                }`}
              >
                {label}
              </button>
            );
          },
        )}
      </div>

      <div className="flex justify-center">
        <div
          className="w-full overflow-hidden border border-[var(--line)] bg-[var(--surface)]"
          style={{
            aspectRatio:
              `${format.width} / ${format.height}`,
            maxWidth:
              selected === 'story'
                ? '22rem'
                : selected === 'feed'
                  ? '30rem'
                  : '48rem',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={selected}
            src={imagePath}
            alt={labels.previewAlt}
            width={format.width}
            height={format.height}
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-7 gap-y-4">
        <button
          type="button"
          onClick={shareSelected}
          disabled={
            sharing || downloading
          }
          className="font-mono text-eyebrow uppercase text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--text)] disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {sharing
            ? labels.sharing
            : labels.share}
        </button>

        <button
          type="button"
          onClick={() => {
            void downloadSelected();
          }}
          disabled={
            sharing || downloading
          }
          className="font-mono text-eyebrow uppercase text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--text)] disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {downloading
            ? labels.sharing
            : labels.download}
        </button>

        <button
          type="button"
          onClick={copyLink}
          className="font-mono text-eyebrow uppercase text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
        >
          {copied
            ? labels.copied
            : labels.copy}
        </button>
      </div>
    </section>
  );
}
