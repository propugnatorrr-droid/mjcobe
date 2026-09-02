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
    <article className="music-card music-vault-card">
      <div className="music-card-art-link">
        {song.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={song.coverPath}
            alt=""
            width={900}
            height={900}
            loading="lazy"
            className="music-card-art music-vault-art"
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
          <span className="music-card-art-placeholder" />
        )}

        <span
          aria-hidden
          className="music-card-art-treatment music-vault-treatment"
        />

        <span
          aria-hidden
          className="music-vault-lock"
        >
          <LockKeyhole
            size={22}
            strokeWidth={1.6}
          />
        </span>

        <span className="music-card-status">
          <StatusBadge
            status="vault"
            label={label}
          />
        </span>
      </div>

      <div className="music-card-heading">
        <h2 className="music-card-title text-[var(--text-dim)]">
          {song.title}
        </h2>

        <div
          aria-hidden
          className="music-vault-lines"
        >
          <span />
          <span />
          <span />
        </div>
      </div>
    </article>
  );
}
