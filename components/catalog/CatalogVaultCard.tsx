import { LockKeyhole } from 'lucide-react';
import { StatusBadge } from '@/components/primitives/StatusBadge';
import type { CatalogSong } from '@/lib/catalog/queries';

type CatalogVaultCardProps = {
  song: CatalogSong;
  label: string;
};

export function CatalogVaultCard({
  song,
  label,
}: CatalogVaultCardProps) {
  return (
    <article className="music-v2-card music-v2-vault-card">
      <div className="music-v2-card-art-link">
        {song.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={song.coverPath}
            alt=""
            width={900}
            height={900}
            loading="lazy"
            className="music-v2-card-art music-v2-vault-art"
            style={{
              backgroundColor: 'var(--ink)',
              backgroundImage: song.coverPlaceholder
                ? `url("${song.coverPlaceholder}")`
                : undefined,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
        ) : (
          <span className="music-v2-card-art-placeholder" />
        )}

        <span
          aria-hidden
          className="music-v2-card-art-treatment music-v2-vault-treatment"
        />

        <span
          aria-hidden
          className="music-v2-vault-lock"
        >
          <LockKeyhole
            size={22}
            strokeWidth={1.6}
          />
        </span>

        <span className="music-v2-card-status">
          <StatusBadge
            status="vault"
            label={label}
          />
        </span>
      </div>

      <div className="music-v2-card-content">
        <h2 className="music-v2-card-title text-[var(--text-dim)]">
          {song.title}
        </h2>

        <div
          aria-hidden
          className="music-v2-vault-lines"
        >
          <span />
          <span />
          <span />
        </div>
      </div>
    </article>
  );
}
