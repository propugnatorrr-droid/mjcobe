import type {
  AdminCampaignRow,
  AdminSongUpdateRow,
} from '@/lib/admin/songs';
import { admin } from '@/lib/copy/admin';
import {
  SongUpdateCard,
} from './SongUpdateCard';
import {
  SongUpdateForm,
} from './SongUpdateForm';

type Props = {
  songId: string;
  campaigns: AdminCampaignRow[];
  updates: AdminSongUpdateRow[];
};

export function SongUpdatePanel({
  songId,
  campaigns,
  updates,
}: Props) {
  return (
    <section className="mt-16">
      <h2 className="font-mono text-eyebrow uppercase tracking-[0.14em] text-[var(--text)]">
        {admin.songs.updates}
      </h2>

      <p className="mt-3 max-w-[62ch] text-body text-[var(--text-dim)]">
        {admin.songs.updatesHint}
      </p>

      {updates.length === 0 ? (
        <p className="mt-8 text-body text-[var(--text-dim)]">
          {admin.songs.updatesEmpty}
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-5">
          {updates.map(
            (update) => (
              <SongUpdateCard
                key={update.id}
                update={update}
                campaigns={campaigns}
              />
            ),
          )}
        </div>
      )}

      <details className="mt-8 rounded-[var(--radius-panel)] border border-[var(--line)]">
        <summary className="cursor-pointer p-5 font-mono text-eyebrow uppercase text-[var(--champagne)]">
          + {admin.songs.newUpdate}
        </summary>

        <div className="border-t border-[var(--line)] p-6">
          <SongUpdateForm
            songId={songId}
            campaigns={campaigns}
          />
        </div>
      </details>
    </section>
  );
}
