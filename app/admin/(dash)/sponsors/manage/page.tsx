import Link from 'next/link';
import {
  ArrowUpRight,
  Building2,
  Eye,
  EyeOff,
  Pencil,
} from 'lucide-react';
import {
  listAdminSponsors,
} from '@/lib/admin/queries';
import {
  moderateSponsorVisibility,
} from '@/lib/admin/actions';
import {
  AdminHeading,
  AdminHint,
} from '@/components/admin/ui';
import {
  SponsorLogo,
} from '@/components/sponsor/SponsorLogo';
import { admin } from '@/lib/copy/admin';
import {
  cents,
  formatCents,
} from '@/lib/money/cents';

export const dynamic = 'force-dynamic';

function StatusBadge({
  state,
}: {
  state: string;
}) {
  const color =
    state === 'approved'
      ? 'var(--champagne)'
      : state === 'hidden' ||
          state === 'blocked'
        ? 'var(--status-danger)'
        : 'var(--text-dim)';

  return (
    <span
      className="inline-flex items-center gap-2 font-ui text-[0.5625rem] font-semibold uppercase tracking-[0.18em]"
      style={{ color }}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      {state}
    </span>
  );
}

export default async function SponsorDirectoryPage() {
  const sponsors =
    await listAdminSponsors();

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <AdminHeading>
            {admin.sponsors.directory}
          </AdminHeading>

          <AdminHint>
            {admin.sponsors.directoryHint}
          </AdminHint>
        </div>

        <Link
          href="/admin/sponsors"
          className={[
            'inline-flex min-h-11 items-center',
            'justify-center rounded-full',
            'border border-[var(--line)]',
            'px-5 py-3',
            'font-ui text-[0.625rem]',
            'font-semibold uppercase',
            'tracking-[0.16em]',
            'text-[var(--text-dim)]',
            'hover:border-[var(--champagne)]',
            'hover:text-[var(--champagne)]',
          ].join(' ')}
        >
          {admin.sponsors.review}
        </Link>
      </div>

      {sponsors.length === 0 ? (
        <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--ink-2)] p-8">
          <Building2
            aria-hidden
            size={24}
            color="var(--champagne)"
          />

          <p className="mt-4 text-body text-[var(--text-dim)]">
            {admin.sponsors.noSponsors}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sponsors.map((sponsor) => (
            <article
              key={sponsor.id}
              className={[
                'grid gap-5',
                'rounded-[var(--radius-panel)]',
                'border border-[var(--line)]',
                'bg-[var(--ink-2)] p-5',
                'md:grid-cols-[auto_minmax(0,1fr)_auto]',
                'md:items-center',
              ].join(' ')}
            >
              <SponsorLogo
                name={sponsor.businessName}
                src={sponsor.logoPath}
                size="medium"
              />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-serif text-2xl text-[var(--text)]">
                    {sponsor.businessName}
                  </h2>

                  <StatusBadge
                    state={sponsor.moderation}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-ui text-[0.625rem] uppercase tracking-[0.14em] text-[var(--text-dim)]">
                  <span>
                    {admin.sponsors.totalBacked}:{' '}
                    <strong className="font-normal text-[var(--champagne)]">
                      {formatCents(
                        cents(sponsor.netCents),
                      )}
                    </strong>
                  </span>

                  <span>
                    {admin.sponsors.contributions}:{' '}
                    <strong className="font-normal text-[var(--text)]">
                      {sponsor.contributionCount}
                    </strong>
                  </span>

                  {sponsor.industry ? (
                    <span>
                      {sponsor.industry}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 md:justify-end">
                <Link
                  href={`/admin/sponsors/${sponsor.id}`}
                  className="inline-flex items-center gap-2 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text)] hover:text-[var(--champagne)]"
                >
                  <Pencil
                    aria-hidden
                    size={14}
                  />
                  {admin.actions.manage}
                </Link>

                {sponsor.moderation ===
                'approved' ? (
                  <Link
                    href={`/partner/${sponsor.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--champagne)]"
                  >
                    {admin.actions.preview}
                    <ArrowUpRight
                      aria-hidden
                      size={14}
                    />
                  </Link>
                ) : null}

                {sponsor.moderation ===
                  'approved' ||
                sponsor.moderation ===
                  'hidden' ? (
                  <form
                    action={
                      moderateSponsorVisibility
                    }
                  >
                    <input
                      type="hidden"
                      name="sponsorId"
                      value={sponsor.id}
                    />
                    <input
                      type="hidden"
                      name="action"
                      value={
                        sponsor.moderation ===
                        'approved'
                          ? 'hide'
                          : 'show'
                      }
                    />

                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)] hover:text-[var(--champagne)]"
                    >
                      {sponsor.moderation ===
                      'approved' ? (
                        <EyeOff
                          aria-hidden
                          size={14}
                        />
                      ) : (
                        <Eye
                          aria-hidden
                          size={14}
                        />
                      )}

                      {sponsor.moderation ===
                      'approved'
                        ? admin.actions.hide
                        : admin.actions.unhide}
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
