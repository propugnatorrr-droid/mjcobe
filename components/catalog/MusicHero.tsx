import { Disc3, Music2 } from 'lucide-react';

type MusicHeroProps = {
  title: string;
  eyebrow: string;
  intro: string;
  recordCount: number;
};

export function MusicHero({
  title,
  eyebrow,
  intro,
  recordCount,
}: MusicHeroProps) {
  return (
    <header
      aria-labelledby="music-page-title"
      className="music-hero"
    >
      <div
        aria-hidden
        className="music-hero-disc"
      >
        <span className="music-hero-disc-ring" />
        <span className="music-hero-disc-label">
          <Music2 size={22} strokeWidth={1.5} />
        </span>
      </div>

      <div className="site-shell music-hero-shell">
        <div className="music-hero-copy">
          <p className="music-hero-eyebrow">
            <Disc3
              aria-hidden
              size={15}
              strokeWidth={1.7}
            />

            {eyebrow}
          </p>

          <h1
            id="music-page-title"
            className="music-hero-title"
          >
            {title}
          </h1>

          <p className="music-hero-intro">
            {intro}
          </p>
        </div>

        <div className="music-hero-meta">
          <p className="numeric">
            {String(recordCount).padStart(2, '0')}
          </p>

          <span>RECORDS</span>
        </div>
      </div>
    </header>
  );
}
