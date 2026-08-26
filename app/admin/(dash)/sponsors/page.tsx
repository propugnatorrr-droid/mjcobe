import { listPendingSponsors } from '@/lib/admin/queries';
import { approveSponsor, declineSponsor } from '@/lib/admin/actions';
import { AdminHeading, AdminHint, InlineAction } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';
import { cents, formatCents } from '@/lib/money/cents';
import { formatDay } from '@/lib/song/queries';

export const dynamic = 'force-dynamic';

export default async function SponsorReviewPage() {
  const pending = await listPendingSponsors();

  return (
    <>
      <AdminHeading>{admin.sponsors.heading}</AdminHeading>
      <AdminHint>{admin.sponsors.approveHint}</AdminHint>

      {pending.length === 0 ? (
        <p className="text-body text-[var(--text-dim)]">{admin.sponsors.empty}</p>
      ) : (
        <div className="border-t border-[var(--line-strong)]">
          {pending.map(async (p) => (
            <article
              key={p.contributionId}
              className="grid grid-cols-1 gap-8 border-b border-[var(--line)] py-10 md:grid-cols-[1fr_auto] md:gap-16"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                  <h2 className="text-body uppercase tracking-[0.06em] text-[var(--text)]">
                    {p.businessName}
                  </h2>
                  <span className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                    {await formatDay(p.submittedAt)}
                  </span>
                </div>

                <dl className="mt-6 grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
                  {[
                    [admin.table.amount, formatCents(cents(p.amountCents))],
                    [admin.table.song, p.songTitle],
                    ['CONTACT', p.repName ?? '—'],
                    ['EMAIL', p.email ?? '—'],
                    ['WEBSITE', p.website ?? '—'],
                    ['INSTAGRAM', p.instagram ?? '—'],
                    ['INDUSTRY', p.industry ?? '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-4">
                      <dt className="w-28 shrink-0 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
                        {label}
                      </dt>
                      <dd className="min-w-0 truncate font-mono text-sm text-[var(--text-dim)]">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>

                {p.message ? (
                  <p className="mt-6 max-w-[62ch] text-body text-[var(--text-dim)]">{p.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col items-start gap-4 md:items-end">
                <form action={approveSponsor}>
                  <input type="hidden" name="contributionId" value={p.contributionId} />
                  <input type="hidden" name="transactionId" value={p.transactionId ?? ''} />
                  <input type="hidden" name="sponsorId" value={p.sponsorId ?? ''} />
                  <input type="hidden" name="songSlug" value={p.songSlug} />
                  <InlineAction>{admin.actions.approve}</InlineAction>
                </form>

                <form action={declineSponsor}>
                  <input type="hidden" name="contributionId" value={p.contributionId} />
                  <input type="hidden" name="transactionId" value={p.transactionId ?? ''} />
                  <input type="hidden" name="sponsorId" value={p.sponsorId ?? ''} />
                  <input type="hidden" name="reason" value="unverified_sponsor" />
                  <InlineAction danger>{admin.actions.decline}</InlineAction>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
