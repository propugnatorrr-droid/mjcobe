import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Layers3,
  Music2,
  Radio,
} from 'lucide-react';
import {
  activatePublishedCampaigns,
  listCampaignHealth,
} from '@/lib/admin/campaigns';
import {
  AdminHeading,
  AdminHint,
} from '@/components/admin/ui';

export const dynamic =
  'force-dynamic';

type Props = {
  searchParams: Promise<{
    updated?: string;
  }>;
};

function StatusBadge({
  ready,
}: {
  ready: boolean;
}) {
  return (
    <span
      className={[
        'admin-v5-status',
        ready
          ? 'admin-v5-status-ready'
          : 'admin-v5-status-warning',
      ].join(' ')}
    >
      {ready ? (
        <CheckCircle2
          aria-hidden
          size={14}
        />
      ) : (
        <AlertTriangle
          aria-hidden
          size={14}
        />
      )}

      {ready
        ? 'READY'
        : 'ACTION REQUIRED'}
    </span>
  );
}

export default async function CampaignControlPage({
  searchParams,
}: Props) {
  const { updated } =
    await searchParams;

  const rows =
    await listCampaignHealth();

  const readyCount =
    rows.filter(
      (row) => row.ready,
    ).length;

  const attentionCount =
    rows.length - readyCount;

  return (
    <section className="admin-v5-page">
      <div className="admin-v5-page-header">
        <div>
          <AdminHeading>
            CAMPAIGN CONTROL
          </AdminHeading>

          <AdminHint>
            Create or repair payable
            campaigns for every
            published song. Changes are
            applied directly to the
            deployed database and take
            effect on the public
            checkout immediately.
          </AdminHint>
        </div>

        <form
          action={
            activatePublishedCampaigns
          }
        >
          <button
            type="submit"
            className="admin-v5-primary"
          >
            <Radio
              aria-hidden
              size={17}
            />
            ACTIVATE ALL PUBLISHED SONGS
          </button>
        </form>
      </div>

      {updated === '1' ? (
        <div
          role="status"
          className="admin-v5-success"
        >
          <CheckCircle2
            aria-hidden
            size={18}
          />

          Campaigns and support tiers
          were checked successfully.
        </div>
      ) : null}

      <div className="admin-v5-metrics admin-v5-campaign-metrics">
        <article className="admin-v5-metric">
          <Music2
            aria-hidden
            size={18}
          />

          <span>
            PUBLISHED SONGS
          </span>

          <strong>{rows.length}</strong>
        </article>

        <article className="admin-v5-metric">
          <CircleDollarSign
            aria-hidden
            size={18}
          />

          <span>
            CHECKOUT READY
          </span>

          <strong>{readyCount}</strong>
        </article>

        <article className="admin-v5-metric">
          <AlertTriangle
            aria-hidden
            size={18}
          />

          <span>
            NEED ATTENTION
          </span>

          <strong>
            {attentionCount}
          </strong>
        </article>
      </div>

      {rows.length === 0 ? (
        <div className="admin-v5-empty">
          <Music2
            aria-hidden
            size={24}
          />

          <p>
            No published songs were
            found. Publish songs in Song
            Management before activating
            campaigns.
          </p>

          <Link
            href="/admin/songs"
            className="admin-v5-secondary"
          >
            OPEN SONG MANAGEMENT
          </Link>
        </div>
      ) : (
        <div className="admin-v5-campaign-grid">
          {rows.map((row) => (
            <article
              key={row.songId}
              className="admin-v5-campaign-card"
            >
              <header>
                <div>
                  <span>
                    {row.songStatus}
                  </span>

                  <h2>
                    {row.songTitle}
                  </h2>

                  <p>
                    /{row.songSlug}
                  </p>
                </div>

                <StatusBadge
                  ready={row.ready}
                />
              </header>

              <dl>
                <div>
                  <dt>CAMPAIGN</dt>
                  <dd>
                    {row.campaignName ??
                      'Not created'}
                  </dd>
                </div>

                <div>
                  <dt>STATUS</dt>
                  <dd>
                    {row.campaignStatus ??
                      'Missing'}
                  </dd>
                </div>

                <div>
                  <dt>ACCEPT SUPPORT</dt>
                  <dd>
                    {row.acceptSupport
                      ? 'Yes'
                      : 'No'}
                  </dd>
                </div>

                <div>
                  <dt>FAN SUPPORT</dt>
                  <dd>
                    {row.fanSupportEnabled
                      ? 'Enabled'
                      : 'Disabled'}
                  </dd>
                </div>

                <div>
                  <dt>ACTIVE TIERS</dt>
                  <dd>
                    <Layers3
                      aria-hidden
                      size={14}
                    />
                    {row.tierCount}
                  </dd>
                </div>
              </dl>

              <footer>
                <Link
                  href={`/song/${row.songSlug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  VIEW SONG
                  <ExternalLink
                    aria-hidden
                    size={14}
                  />
                </Link>

                {row.ready ? (
                  <Link
                    href={`/back?song=${row.songSlug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    TEST CHECKOUT
                    <ExternalLink
                      aria-hidden
                      size={14}
                    />
                  </Link>
                ) : (
                  <span>
                    ACTIVATE TO ENABLE
                    CHECKOUT
                  </span>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
