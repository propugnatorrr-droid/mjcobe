import { notFound } from 'next/navigation';
import { getSongAdmin } from '@/lib/admin/songs';
import { AdminHeading, AdminHint } from '@/components/admin/ui';
import { SongForm } from '@/components/admin/SongForm';
import { CampaignForm } from '@/components/admin/CampaignForm';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function EditSongPage({ params }: Props) {
  const { id } = await params;
  const data = await getSongAdmin(id);
  if (!data) notFound();

  const { song, campaigns } = data;

  return (
    <>
      <AdminHeading>{admin.songs.editHeading}</AdminHeading>
      <AdminHint>{song.title}</AdminHint>
      <SongForm song={song} />

      <div className="mt-16">
        <h2 className="mb-6 font-mono text-eyebrow uppercase tracking-[0.14em] text-[var(--text)]">
          {admin.songs.campaigns}
        </h2>

        {campaigns.length === 0 ? (
          <p className="mb-8 text-body text-[var(--text-dim)]">{admin.songs.campaignsEmpty}</p>
        ) : (
          <div className="mb-10 flex flex-col gap-6">
            {campaigns.map((campaign) => (
              <CampaignForm key={campaign.id} songId={song.id} campaign={campaign} />
            ))}
          </div>
        )}

        <h3 className="mb-4 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {admin.songs.newCampaign}
        </h3>
        <CampaignForm songId={song.id} />
      </div>
    </>
  );
}
