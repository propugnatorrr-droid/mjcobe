import Link from 'next/link';
import { ArrowUpRight, Crown } from 'lucide-react';
import { SponsorLogo } from './SponsorLogo';

type PresentingPartnerProps = {
  name: string;
  amount: string;
  amountHidden: boolean;
  hiddenLabel: string;
  logoPath?: string | null;
  profileHref?: string | null;
  presentingLabel: string;
  contributedLabel: string;
  visitLabel: string;
};

export function PresentingPartner({
  name,
  amount,
  amountHidden,
  hiddenLabel,
  logoPath,
  profileHref,
  presentingLabel,
  contributedLabel,
  visitLabel,
}: PresentingPartnerProps) {
  return (
    <article
      className={[
        'relative overflow-hidden',
        'rounded-[var(--radius-panel)]',
        'border border-[rgba(201,162,39,0.58)]',
        'bg-[var(--ink-2)] p-6 sm:p-8 lg:p-10',
      ].join(' ')}
      style={{
        boxShadow:
          '0 0 38px rgba(201,162,39,0.1), 0 30px 80px rgba(0,0,0,0.34)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px rule-gold"
      />

      <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-5 sm:gap-7">
          <SponsorLogo
            name={name}
            src={logoPath}
            size="large"
            priority
          />

          <div className="min-w-0">
            <p className="flex items-center gap-2 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-[var(--champagne)]">
              <Crown aria-hidden size={14} />
              {presentingLabel}
            </p>

            <h2 className="mt-3 font-display text-[clamp(2rem,5vw,4.5rem)] uppercase leading-[0.92] text-[var(--text)]">
              {name}
            </h2>

            <p className="mt-4 font-ui text-[0.625rem] uppercase tracking-[0.18em] text-[var(--text-dim)]">
              {contributedLabel}
            </p>

            <p className="numeric mt-1 font-serif text-3xl leading-none text-gold sm:text-4xl">
              {amountHidden ? hiddenLabel : amount}
            </p>
          </div>
        </div>

        {profileHref ? (
          <Link
            href={profileHref}
            className={[
              'inline-flex min-h-12 shrink-0 items-center justify-center gap-2',
              'rounded-full border border-[var(--champagne)]',
              'px-6 py-3',
              'font-ui text-[0.6875rem] font-semibold uppercase',
              'tracking-[0.14em] text-[var(--champagne)]',
              'transition-colors',
              '[transition-duration:var(--duration-signature)]',
              'hover:bg-[rgba(201,162,39,0.09)]',
            ].join(' ')}
          >
            {visitLabel}
            <ArrowUpRight aria-hidden size={15} />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
