'use client';

import {
  ImagePlus,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
} from 'react';

type SponsorLogoUploadProps = {
  label: string;
  help: string;
  chooseLabel: string;
  removeLabel: string;
};

export function SponsorLogoUpload({
  label,
  help,
  chooseLabel,
  removeLabel,
}: SponsorLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    null,
  );
  const [fileName, setFileName] = useState<string | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function selectFile(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.currentTarget.files?.[0];

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    if (!file) {
      setPreview(null);
      setFileName(null);
      return;
    }

    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
  }

  function removeFile() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    if (inputRef.current) {
      inputRef.current.value = '';
    }

    setPreview(null);
    setFileName(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label
          htmlFor="sponsor-logo"
          className="font-ui text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-dim)]"
        >
          {label}
        </label>

        <span className="font-ui text-[0.5625rem] uppercase tracking-[0.14em] text-[var(--text-faint)]">
          PNG / WEBP · 2 MB MAX
        </span>
      </div>

      <div
className={[
  'sponsor-v3-upload',
  'mt-3 grid gap-5',
  'rounded-[var(--radius-panel)]',
  'border border-dashed border-[var(--line-strong)]',
  'bg-[var(--field-bg)] p-5',
  'sm:grid-cols-[7rem_minmax(0,1fr)]',
  'sm:items-center',
].join(' ')}
      >
        <div
          className={[
            'flex h-28 w-full items-center justify-center',
            'overflow-hidden rounded-[var(--radius-panel)]',
            'border border-[var(--line)] bg-[var(--ink)]',
            'sm:w-28',
          ].join(' ')}
        >
          {preview ? (
            // Local object URLs cannot be rendered by next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="max-h-full max-w-full object-contain p-3"
            />
          ) : (
            <ImagePlus
              aria-hidden
              size={28}
              strokeWidth={1.3}
              color="var(--text-faint)"
            />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm leading-6 text-[var(--text-dim)]">
            {help}
          </p>

          {fileName ? (
            <p className="mt-2 truncate font-ui text-xs text-[var(--text)]">
              {fileName}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={[
                'inline-flex min-h-11 items-center gap-2',
                'rounded-full border border-[var(--line-strong)]',
                'px-4 py-2',
                'font-ui text-[0.625rem] font-semibold uppercase',
                'tracking-[0.14em] text-[var(--text)]',
                'transition-colors',
                '[transition-duration:var(--duration-signature)]',
                'hover:border-[var(--champagne)]',
                'hover:text-[var(--champagne)]',
              ].join(' ')}
            >
              <Upload aria-hidden size={14} />
              {chooseLabel}
            </button>

            {preview ? (
              <button
                type="button"
                onClick={removeFile}
                className={[
                  'inline-flex min-h-11 items-center gap-2',
                  'rounded-full px-4 py-2',
                  'font-ui text-[0.625rem] font-semibold uppercase',
                  'tracking-[0.14em]',
                  'text-[var(--text-dim)]',
                  'transition-colors',
                  'hover:text-[var(--status-danger)]',
                ].join(' ')}
              >
                <Trash2 aria-hidden size={14} />
                {removeLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        id="sponsor-logo"
        name="logo"
        type="file"
        accept="image/png,image/webp"
        onChange={selectFile}
        className="sr-only"
      />
    </div>
  );
}
