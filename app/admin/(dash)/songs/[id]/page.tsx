import {
  notFound,
} from 'next/navigation';
import {
  getSongAdmin,
} from '@/lib/admin/songs';
import {
  AdminHeading,
  AdminHint,
} from '@/components/admin/ui';
import {
  SongForm,
} from '@/components/admin/SongForm';
import {
  SongMediaManager,
} from '@/components/admin/SongMediaManager';
import {
  CampaignForm,
} from '@/components/admin/CampaignForm';
import {
  SupportTierPanel,
} from '@/components/admin/SupportTierPanel';
import {
  SongUpdatePanel,
} from '@/components/admin/SongUpdatePanel';
import {
  SponsorPackagePanel,
} from '@/components/admin/SponsorPackagePanel';
import { admin } from '@/lib/copy/admin';

export const dynamic =
  'force-dynamic';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditSongPage({
  params,
}: Props) {
  const { id } = await params;

  const data =
    await getSongAdmin(id);

  if (!data) {
    notFound();
  }

  const {
    song,
    campaigns,
    tiers,
    packages,
    updates,
    cover,
    audio,
    mediaLibrary,
  } = data;

  return (
    <>
      <AdminHeading>
        {admin.songs.editHeading}
      </AdminHeading>

      <AdminHint>
        {song.title}
      </AdminHint>

      <SongForm song={song} />

      <SongMediaManager
        song={song}
        cover={cover}
        audio={audio}
        mediaLibrary={
          mediaLibrary
        }
      />

      <section className="mt-16">
        <h2 className="mb-6 font-mono text-eyebrow uppercase tracking-[0.14em] text-[var(--text)]">
          {admin.songs.campaigns}
        </h2>

        {campaigns.length === 0 ? (
          <p className="mb-8 text-body text-[var(--text-dim)]">
            {
              admin.songs
                .campaignsEmpty
            }
          </p>
        ) : (
          <div className="mb-10 flex flex-col gap-6">
            {campaigns.map(
              (campaign) => (
                <CampaignForm
                  key={campaign.id}
                  songId={song.id}
                  campaign={campaign}
                />
              ),
            )}
          </div>
        )}

        <h3 className="mb-4 font-mono text-eyebrow uppercase text-[var(--text-dim)]">
          {admin.songs.newCampaign}
        </h3>

        <CampaignForm
          songId={song.id}
        />
      </section>

      {campaigns.length > 0 ? (
        <section className="mt-16">
          <h2 className="mb-6 font-mono text-eyebrow uppercase tracking-[0.14em] text-[var(--text)]">
            {
              admin.songs
                .supportTiers
            }
          </h2>

          <div className="flex flex-col gap-6">
            {campaigns.map(
              (campaign) => (
                <SupportTierPanel
                  key={campaign.id}
                  campaign={campaign}
                  tiers={tiers.filter(
                    (tier) =>
                      tier.campaignId ===
                      campaign.id,
                  )}
                />
              ),
            )}
          </div>
        </section>
      ) : null}

      {campaigns.length > 0 ? (
        <section className="mt-16">
          <h2 className="mb-6 font-mono text-eyebrow uppercase tracking-[0.14em] text-[var(--text)]">
            {
              admin.songs
                .sponsorPackages
            }
          </h2>

          <div className="flex flex-col gap-6">
            {campaigns.map(
              (campaign) => (
                <SponsorPackagePanel
                  key={campaign.id}
                  campaign={campaign}
                  packages={packages.filter(
                    (sponsorPackage) =>
                      sponsorPackage
                        .campaignId ===
                      campaign.id,
                  )}
                />
              ),
            )}
          </div>
        </section>
      ) : null}

      <SongUpdatePanel
        songId={song.id}
        campaigns={campaigns}
        updates={updates}
      />
    </>
  );
}
