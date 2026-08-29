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
      className="music-v2-hero"
    >
      <div
        aria-hidden
        className="music-v2-hero-disc"
      >
        <span className="music-v2-hero-disc-ring" />
        <span className="music-v2-hero-disc-label">
          <Music2 size={22} strokeWidth={1.5} />
        </span>
      </div>

      <div className="site-shell music-v2-hero-shell">
        <div className="music-v2-hero-copy">
          <p className="music-v2-hero-eyebrow">
            <Disc3
              aria-hidden
              size={15}
              strokeWidth={1.7}
            />

            {eyebrow}
          </p>

          <h1
            id="music-page-title"
            className="music-v2-hero-title"
          >
            {title}
          </h1>

          <p className="music-v2-hero-intro">
            {intro}
          </p>
        </div>

        <div className="music-v2-hero-meta">
          <p className="numeric">
            {String(recordCount).padStart(2, '0')}
          </p>

          <span>RECORDS</span>
        </div>
      </div>
    </header>
  );
}
