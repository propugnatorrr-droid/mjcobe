import Link from 'next/link';
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import {
  listPendingSponsors,
  type PendingSponsor,
} from '@/lib/admin/queries';
import {
  approveSponsor,
  declineSponsor,
} from '@/lib/admin/actions';
import {
  AdminHeading,
  AdminHint,
} from '@/components/admin/ui';
import { SponsorLogo } from '@/components/sponsor/SponsorLogo';
import { admin } from '@/lib/copy/admin';
import {
  cents,
  formatCents,
} from '@/lib/money/cents';
import { formatDay } from '@/lib/song/queries';

export const dynamic = 'force-dynamic';

type ReviewEntry = {
  sponsor: PendingSponsor;
  submittedLabel: string;
};

function ExternalValue({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className={[
        'inline-flex min-w-0 items-center gap-2',
        'text-[var(--text)]',
        'transition-colors',
        '[transition-duration:var(--duration-signature)]',
        'hover:text-[var(--champagne)]',
      ].join(' ')}
    >
      <span className="truncate">
        {children}
      </span>

      <ArrowUpRight
        aria-hidden
        size={13}
        className="shrink-0"
      />
    </Link>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
        {label}
      </dt>

      <dd className="mt-1 min-w-0 text-sm leading-6 text-[var(--text-dim)]">
        {children}
      </dd>
    </div>
  );
}

export default async function SponsorReviewPage() {
  const pending = await listPendingSponsors();

  const entries: ReviewEntry[] =
    await Promise.all(
      pending.map(async (sponsor) => ({
        sponsor,
        submittedLabel: await formatDay(
          sponsor.submittedAt,
        ),
      })),
    );

  return (
    <>
      <AdminHeading>
        {admin.sponsors.heading}
      </AdminHeading>

      <AdminHint>
        {admin.sponsors.approveHint}
      </AdminHint>

      {entries.length === 0 ? (
        <div
          className={[
            'rounded-[var(--radius-panel)]',
            'border border-[var(--line)]',
            'bg-[var(--ink-2)] p-8',
          ].join(' ')}
        >
          <ShieldCheck
            aria-hidden
            size={24}
            color="var(--champagne)"
          />

          <p className="mt-4 text-body text-[var(--text-dim)]">
            {admin.sponsors.empty}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {entries.map(
            ({ sponsor, submittedLabel }) => (
              <article
                key={sponsor.contributionId}
                className={[
                  'overflow-hidden',
                  'rounded-[var(--radius-panel)]',
                  'border border-[var(--line)]',
                  'bg-[var(--ink-2)]',
                ].join(' ')}
              >
                <header className="flex flex-col gap-5 border-b border-[var(--line)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex min-w-0 items-center gap-4">
                    <SponsorLogo
                      name={sponsor.businessName}
                      src={sponsor.logoPath}
                      size="medium"
                    />

                    <div className="min-w-0">
                      <p className="font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-[var(--champagne)]">
                        {
                          admin.sponsors
                            .pending
                        }
                      </p>

                      <h2 className="mt-1 truncate font-serif text-2xl text-[var(--text)] sm:text-3xl">
                        {
                          sponsor.businessName
                        }
                      </h2>

                      <p className="mt-2 flex items-center gap-2 font-ui text-[0.625rem] uppercase tracking-[0.14em] text-[var(--text-dim)]">
                        <CalendarDays
                          aria-hidden
                          size={13}
                        />
                        {submittedLabel}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <p className="font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
                      {admin.table.amount}
                    </p>

                    <p className="numeric mt-1 font-serif text-3xl text-gold">
                      {formatCents(
                        cents(
                          sponsor.amountCents,
                        ),
                      )}
                    </p>

                    <p className="mt-2 font-ui text-[0.625rem] uppercase tracking-[0.14em] text-[var(--text-dim)]">
                      {sponsor.songTitle}
                    </p>
                  </div>
                </header>

                <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="min-w-0">
                    <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                      <Detail
                        label={
                          admin.sponsors
                            .contact
                        }
                      >
                        <span className="inline-flex items-center gap-2">
                          <Building2
                            aria-hidden
                            size={14}
                          />
                          {sponsor.repName ??
                            '—'}
                        </span>
                      </Detail>

                      <Detail
                        label={
                          admin.table
                            .paymentState
                        }
                      >
                        <span className="uppercase">
                          {
                            sponsor.transactionState
                          }
                        </span>
                      </Detail>

                      <Detail
                        label={
                          admin.email
                        }
                      >
                        {sponsor.email ? (
                          <Link
                            href={`mailto:${sponsor.email}`}
                            className="inline-flex items-center gap-2 text-[var(--text)] hover:text-[var(--champagne)]"
                          >
                            <Mail
                              aria-hidden
                              size={14}
                            />
                            {sponsor.email}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </Detail>

                      <Detail
                        label={
                          admin.sponsors
                            .phone
                        }
                      >
                        {sponsor.phone ? (
                          <Link
                            href={`tel:${sponsor.phone}`}
                            className="inline-flex items-center gap-2 text-[var(--text)] hover:text-[var(--champagne)]"
                          >
                            <Phone
                              aria-hidden
                              size={14}
                            />
                            {sponsor.phone}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </Detail>

                      <Detail
                        label={
                          admin.sponsors
                            .website
                        }
                      >
                        {sponsor.website ? (
                          <ExternalValue
                            href={
                              sponsor.website
                            }
                          >
                            {
                              sponsor.website
                            }
                          </ExternalValue>
                        ) : (
                          '—'
                        )}
                      </Detail>

                      <Detail
                        label={
                          admin.sponsors
                            .instagram
                        }
                      >
                        {sponsor.instagram ? (
                          <ExternalValue
                            href={`https://instagram.com/${sponsor.instagram}`}
                          >
                            @
                            {
                              sponsor.instagram
                            }
                          </ExternalValue>
                        ) : (
                          '—'
                        )}
                      </Detail>

                      <Detail
                        label={
                          admin.sponsors
                            .industry
                        }
                      >
                        {sponsor.industry ??
                          '—'}
                      </Detail>

                      <Detail
                        label={admin.table.song}
                      >
                        <Link
                          href={`/song/${sponsor.songSlug}`}
                          target="_blank"
                          className="inline-flex items-center gap-2 text-[var(--text)] hover:text-[var(--champagne)]"
                        >
                          {sponsor.songTitle}
                          <ArrowUpRight
                            aria-hidden
                            size={13}
                          />
                        </Link>
                      </Detail>
                    </dl>

                    {sponsor.message ? (
                      <div className="mt-7 border-t border-[var(--line)] pt-6">
                        <p className="font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
                          {
                            admin.sponsors
                              .message
                          }
                        </p>

                        <p className="mt-3 max-w-[65ch] whitespace-pre-wrap text-sm leading-6 text-[var(--text-dim)]">
                          {sponsor.message}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <aside
                    className={[
                      'h-fit rounded-[var(--radius-panel)]',
                      'border border-[var(--line)]',
                      'bg-[var(--ink)] p-5',
                    ].join(' ')}
                  >
                    <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text)]">
                      {admin.sponsors.review}
                    </p>

                    <p className="mt-3 text-xs leading-5 text-[var(--text-dim)]">
                      {
                        admin.sponsors
                          .declineHint
                      }
                    </p>

                    <form
                      action={approveSponsor}
                      className="mt-6"
                    >
                      <input
                        type="hidden"
                        name="contributionId"
                        value={
                          sponsor.contributionId
                        }
                      />

                      <button
                        type="submit"
                        className={[
                          'bg-gold',
                          'inline-flex min-h-12 w-full items-center justify-center',
                          'rounded-full px-5 py-3',
                          'font-ui text-[0.625rem] font-semibold uppercase',
                          'tracking-[0.14em] text-[var(--ink)]',
                          'transition-[filter,transform]',
                          'hover:brightness-110',
                          'active:translate-y-px',
                        ].join(' ')}
                      >
                        {
                          admin.actions
                            .approve
                        }
                      </button>
                    </form>

                    <form
                      action={declineSponsor}
                      className="mt-4"
                    >
                      <input
                        type="hidden"
                        name="contributionId"
                        value={
                          sponsor.contributionId
                        }
                      />

                      <label className="block">
                        <span className="font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">
                          {
                            admin.sponsors
                              .declineReason
                          }
                        </span>

                        <select
                          name="reason"
                          defaultValue="unverified_sponsor"
                          className={[
                            'mt-2 min-h-11 w-full',
                            'rounded-[var(--radius-panel)]',
                            'border border-[var(--line)]',
                            'bg-[var(--ink-2)] px-3',
                            'font-ui text-sm text-[var(--text)]',
                            'focus:border-[var(--champagne)]',
                            'focus:outline-none',
                          ].join(' ')}
                        >
                          <option value="unverified_sponsor">
                            {
                              admin.refund
                                .reasons
                                .unverified_sponsor
                            }
                          </option>

                          <option value="brand_safety">
                            {
                              admin.refund
                                .reasons
                                .brand_safety
                            }
                          </option>

                          <option value="fraud_risk">
                            {
                              admin.refund
                                .reasons
                                .fraud_risk
                            }
                          </option>

                          <option value="duplicate_payment">
                            {
                              admin.refund
                                .reasons
                                .duplicate_payment
                            }
                          </option>

                          <option value="customer_request">
                            {
                              admin.refund
                                .reasons
                                .customer_request
                            }
                          </option>

                          <option value="other">
                            {
                              admin.refund
                                .reasons.other
                            }
                          </option>
                        </select>
                      </label>

                      <button
                        type="submit"
                        className={[
                          'mt-4 inline-flex min-h-11 w-full',
                          'items-center justify-center',
                          'rounded-full border',
                          'border-[rgba(142,29,34,0.7)]',
                          'px-5 py-3',
                          'font-ui text-[0.625rem] font-semibold uppercase',
                          'tracking-[0.14em] text-[var(--status-danger)]',
                          'transition-colors',
                          'hover:bg-[rgba(142,29,34,0.1)]',
                        ].join(' ')}
                      >
                        {
                          admin.actions
                            .decline
                        }
                      </button>
                    </form>
                  </aside>
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </>
  );
}
