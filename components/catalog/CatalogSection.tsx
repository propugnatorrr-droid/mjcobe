import { SectionHeading } from '@/components/primitives/SectionHeading';
import {
  CatalogSongCard,
  type CatalogCardLabels,
} from '@/components/catalog/CatalogSongCard';
import type { CatalogSong } from '@/lib/catalog/queries';

type CatalogSectionProps = {
  heading: string;
  subheading: string;
  songs: CatalogSong[];
  labels: CatalogCardLabels;
};

export function CatalogSection({
  heading,
  subheading,
  songs,
  labels,
}: CatalogSectionProps) {
  if (songs.length === 0) return null;

  return (
    <section
      aria-labelledby={`catalog-${heading.toLowerCase().replaceAll(' ', '-')}`}
      className="catalog-section"
    >
      <div
        id={`catalog-${heading.toLowerCase().replaceAll(' ', '-')}`}
      >
        <SectionHeading sub={subheading}>
          {heading}
        </SectionHeading>
      </div>

      <div className="catalog-grid mt-7">
        {songs.map((song) => (
          <CatalogSongCard
            key={song.id}
            song={song}
            labels={labels}
          />
        ))}
      </div>
    </section>
  );
}
