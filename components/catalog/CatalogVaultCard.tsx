import { Lock } from 'lucide-react';
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
    <article className="catalog-song-card panel min-w-0 overflow-hidden">
      <div className="catalog-song-art relative overflow-hidden bg-[var(--ink)]">
        {song.coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={song.coverPath}
            alt=""
            width={720}
            height={720}
            loading="lazy"
            className="h-full w-full object-cover grayscale"
            style={{
              opacity: 0.28,
              backgroundImage: song.coverPlaceholder
                ? `url("${song.coverPlaceholder}")`
                : undefined,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
        ) : null}

        <div
          aria-hidden
          className="absolute inset-0 bg-[rgba(10,10,11,0.5)]"
        />

        <div
          aria-hidden
          className={[
            'absolute left-1/2 top-1/2',
            'flex h-14 w-14 -translate-x-1/2 -translate-y-1/2',
            'items-center justify-center rounded-full',
            'border border-[rgba(201,162,39,0.48)]',
            'bg-[rgba(10,10,11,0.88)]',
          ].join(' ')}
        >
          <Lock
            size={21}
            strokeWidth={1.7}
            color="var(--champagne)"
          />
        </div>
      </div>

      <div className="catalog-song-content flex flex-col p-5">
        <h2 className="font-serif text-[1.65rem] leading-[1.02] text-[var(--text-dim)]">
          {song.title}
        </h2>

        <div className="mt-4">
          <StatusBadge status="vault" label={label} />
        </div>
      </div>
    </article>
  );
}
