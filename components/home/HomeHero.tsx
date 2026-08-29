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
      className="home-v2-hero"
    >
      <picture className="home-v2-hero-media">
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
          className="home-v2-hero-image"
        />
      </picture>

      <div
        aria-hidden
        className="home-v2-hero-treatment"
      />

      <div
        aria-hidden
        className="home-v2-hero-frame"
      />

      <div className="site-shell home-v2-hero-shell">
        <div className="home-v2-hero-copy">
<p className="home-v2-eyebrow">
  {eyebrow}
</p>

          <h1
            id="home-hero-heading"
            className="home-v2-title"
          >
            {artistName}
          </h1>

          <p className="home-v2-tagline">
            {tagline}
          </p>

          <p className="home-v2-subcopy">
            {subcopy}
          </p>

          <div className="home-v2-actions">
            <ButtonLink
              href="/back"
              variant="primary"
              glow
              className="home-v2-primary-action"
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
              className="home-v2-secondary-action"
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

        <div
          aria-hidden
          className="home-v2-index"
        >
          <span>EST.</span>
          <strong>2026</strong>
        </div>
      </div>

      <div
        aria-hidden
        className="home-v2-scroll"
      >
        <span>SCROLL TO DISCOVER</span>
        <span className="home-v2-scroll-line" />
      </div>
    </section>
  );
}
