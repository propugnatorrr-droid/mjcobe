import type {
  AdminCampaignRow,
  AdminSongUpdateRow,
} from '@/lib/admin/songs';
import {
  setSongUpdatePublication,
  setSongUpdateVisibility,
} from '@/lib/admin/song-update-actions';
import {
  cents,
  formatCents,
} from '@/lib/money/cents';
import { admin } from '@/lib/copy/admin';
import {
  SongUpdateForm,
} from './SongUpdateForm';

type Props = {
  update: AdminSongUpdateRow;
  campaigns: AdminCampaignRow[];
};

function updateDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    'en-US',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    },
  ).format(date);
}

export function SongUpdateCard({
  update,
  campaigns,
}: Props) {
  const now = Date.now();

  const publicationState =
    !update.publishedAt
      ? admin.songs.updateDraft
      : update.publishedAt
            .getTime() > now
        ? admin.songs.updateScheduled
        : admin.songs.updatePublished;

  const campaign =
    campaigns.find(
      (candidate) =>
        candidate.id ===
        update.campaignId,
    ) ?? null;

  return (
    <article
      className="overflow-hidden rounded-[var(--radius-panel)] border"
      style={{
        borderColor: 'var(--line)',
        background: 'var(--ink-2)',
      }}
    >
      <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">
              {publicationState}
            </span>

            <span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">
              {update.isVisible
                ? admin.songs
                    .updateVisibleState
                : admin.songs
                    .updateHiddenState}
            </span>

            <span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-[0.625rem] uppercase text-[var(--text-dim)]">
              {update.minTierCents > 0
                ? admin.songs
                    .updateGated
                : admin.songs
                    .updatePublic}
            </span>
          </div>

          <h3 className="mt-4 font-display text-2xl uppercase text-[var(--text)]">
            {update.title}
          </h3>

          <p className="mt-2 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
            {campaign
              ? campaign.name
              : admin.songs
                  .noUpdateCampaign}
          </p>

          {update.publishedAt ? (
            <p className="mt-2 font-mono text-eyebrow uppercase text-[var(--text-faint)]">
              {updateDate(
                update.publishedAt,
              )}
            </p>
          ) : null}

          {update.minTierCents > 0 ? (
            <p className="mt-2 font-mono text-eyebrow uppercase text-[var(--champagne)]">
              {formatCents(
                cents(
                  update.minTierCents,
                ),
              )}
            </p>
          ) : null}

          <p className="mt-4 max-w-[62ch] whitespace-pre-wrap text-body text-[var(--text-dim)]">
            {update.body}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3">
          <form
            action={
              setSongUpdatePublication
            }
          >
            <input
              type="hidden"
              name="updateId"
              value={update.id}
            />

            <input
              type="hidden"
              name="publish"
              value={
                update.publishedAt
                  ? 'false'
                  : 'true'
              }
            />

            <button
              type="submit"
              className="rounded-full border border-[var(--line)] px-4 py-2 font-mono text-eyebrow uppercase text-[var(--text-dim)] hover:border-[var(--champagne)] hover:text-[var(--champagne)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
            >
              {update.publishedAt
                ? admin.songs
                    .unpublishUpdate
                : admin.songs
                    .publishUpdate}
            </button>
          </form>

          <form
            action={
              setSongUpdateVisibility
            }
          >
            <input
              type="hidden"
              name="updateId"
              value={update.id}
            />

            <input
              type="hidden"
              name="isVisible"
              value={
                update.isVisible
                  ? 'false'
                  : 'true'
              }
            />

            <button
              type="submit"
              className="rounded-full border border-[var(--line)] px-4 py-2 font-mono text-eyebrow uppercase text-[var(--text-dim)] hover:border-[var(--champagne)] hover:text-[var(--champagne)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
            >
              {update.isVisible
                ? admin.songs
                    .hideUpdate
                : admin.songs
                    .showUpdate}
            </button>
          </form>
        </div>
      </div>

      <details className="border-t border-[var(--line)]">
        <summary className="cursor-pointer px-6 py-4 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {admin.songs.editUpdate}
        </summary>

        <div className="border-t border-[var(--line)] p-6">
          <SongUpdateForm
            songId={update.songId}
            campaigns={campaigns}
            update={update}
          />
        </div>
      </details>
    </article>
  );
}
