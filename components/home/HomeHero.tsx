import { ArrowRight, Play } from 'lucide-react';
import { ButtonLink } from '@/components/primitives/Button';

type HomeHeroProps = {
  imageAlt: string;
  eyebrow: string;
  artistName: string;
  tagline: string;
  subcopy: string;
  listenLabel: string;
  ctaLabel: string;
};

export function HomeHero({
  imageAlt,
  eyebrow,
  artistName,
  tagline,
  subcopy,
  listenLabel,
  ctaLabel,
}: HomeHeroProps) {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="home-hero"
    >
      <picture className="home-hero-media">
        <source
          media="(min-width: 768px)"
          srcSet="/media/home-hero-desktop.webp"
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/home-hero-mobile.webp"
          alt={imageAlt}
          width={1200}
          height={1500}
          fetchPriority="high"
          className="home-hero-image"
        />
      </picture>

      <div
        aria-hidden
        className="home-hero-treatment"
      />

      <div
        aria-hidden
        className="home-hero-frame"
      />

      <div className="site-shell home-hero-shell">
        <div className="home-hero-copy">
          <p className="home-hero-eyebrow">
            {eyebrow}
          </p>

          <h1
            id="home-hero-heading"
            className="home-hero-title"
          >
            {artistName}
          </h1>

          <p className="home-hero-tagline">
            {tagline}
          </p>

          <p className="home-hero-subcopy">
            {subcopy}
          </p>

          <div className="home-hero-actions">
            <ButtonLink
              href="/back"
              variant="primary"
              glow
              className="home-hero-primary-action"
            >
              {ctaLabel}

              <ArrowRight
                aria-hidden
                size={17}
                strokeWidth={1.8}
              />
            </ButtonLink>

            <ButtonLink
              href="/music"
              variant="ghost"
              className="home-hero-secondary-action"
            >
              <Play
                aria-hidden
                size={14}
                strokeWidth={1.8}
                fill="currentColor"
              />

              {listenLabel}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
