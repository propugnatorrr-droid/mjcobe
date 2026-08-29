import {
  CatalogSongCard,
  type CatalogCardLabels,
} from '@/components/catalog/CatalogSongCard';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import type { CatalogSong } from '@/lib/catalog/queries';

type CatalogSectionProps = {
  heading: string;
  subheading: string;
  songs: CatalogSong[];
  labels: CatalogCardLabels;
  featured?: boolean;
};

function headingId(heading: string) {
  return `catalog-${heading
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')}`;
}

export function CatalogSection({
  heading,
  subheading,
  songs,
  labels,
  featured = false,
}: CatalogSectionProps) {
  if (songs.length === 0) {
    return null;
  }

  const id = headingId(heading);

  return (
    <section
      aria-labelledby={id}
      className={[
        'music-v2-section',
        featured ? 'music-v2-section-featured' : '',
      ].join(' ')}
    >
      <div id={id}>
        <SectionHeading sub={subheading}>
          {heading}
        </SectionHeading>
      </div>

      <div
        className={[
          'music-v2-grid',
          featured ? 'music-v2-grid-featured' : '',
        ].join(' ')}
      >
        {songs.map((song, index) => (
          <CatalogSongCard
            key={song.id}
            song={song}
            labels={labels}
            featured={featured && index === 0}
          />
        ))}
      </div>
    </section>
  );
}
