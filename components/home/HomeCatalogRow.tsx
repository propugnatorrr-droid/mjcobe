import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import {
  CatalogSongCard,
  type CatalogCardLabels,
} from '@/components/catalog/CatalogSongCard';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import type { CatalogSong } from '@/lib/catalog/queries';

type HomeCatalogRowProps = {
  id: string;
  heading: string;
  songs: CatalogSong[];
  labels: CatalogCardLabels;
  viewAllHref: string;
  viewAllLabel: string;
};

/** The shared card grid behind both the "more building" and "released"
 * homepage rows — same primitive the /music catalog uses, so a song never
 * gets a second, near-identical card design just because it's on the
 * homepage. */
export function HomeCatalogRow({
  id,
  heading,
  songs,
  labels,
  viewAllHref,
  viewAllLabel,
}: HomeCatalogRowProps) {
  if (songs.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby={id}
      className="home-catalog-row"
    >
      <div className="site-shell">
        <div className="home-catalog-row-heading">
          <div id={id}>
            <SectionHeading>{heading}</SectionHeading>
          </div>

          <Link
            href={viewAllHref}
            className="home-catalog-row-view-all"
          >
            <span>{viewAllLabel}</span>

            <ArrowUpRight
              aria-hidden
              size={15}
              strokeWidth={1.8}
            />
          </Link>
        </div>

        <div className="home-catalog-row-grid">
          {songs.map((song) => (
            <CatalogSongCard
              key={song.id}
              song={song}
              labels={labels}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
