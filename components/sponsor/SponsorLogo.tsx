type SponsorLogoProps = {
  name: string;
  src?: string | null;
  size?: 'small' | 'medium' | 'large';
  priority?: boolean;
};

const SIZE_CLASSES = {
  small: 'h-12 w-16 p-2',
  medium: 'h-20 w-28 p-3',
  large: 'h-28 w-40 p-4 sm:h-32 sm:w-48',
} satisfies Record<NonNullable<SponsorLogoProps['size']>, string>;

export function SponsorLogo({
  name,
  src,
  size = 'medium',
  priority = false,
}: SponsorLogoProps) {
  const initial = name.trim().charAt(0).toUpperCase() || 'M';

  return (
    <span
      className={[
        'flex shrink-0 items-center justify-center overflow-hidden',
        'rounded-[var(--radius-panel)] border border-[var(--line)]',
        'bg-[var(--ink)]',
        SIZE_CLASSES[size],
      ].join(' ')}
    >
      {src ? (
        // Sponsor logos can be stored on configurable external media hosts,
        // so this intentionally avoids coupling them to next/image domains.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${name} logo`}
          loading={priority ? 'eager' : 'lazy'}
          className="block max-h-full max-w-full object-contain"
        />
      ) : (
        <span
          aria-hidden
          className="font-serif text-3xl text-[var(--champagne)]"
        >
          {initial}
        </span>
      )}
    </span>
  );
}
