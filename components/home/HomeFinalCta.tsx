import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/primitives/Button';

type HomeFinalCtaProps = {
  heading: string;
  sub: string;
  ctaLabel: string;
};

export function HomeFinalCta({
  heading,
  sub,
  ctaLabel,
}: HomeFinalCtaProps) {
  return (
    <section
      aria-labelledby="home-final-cta-heading"
      className="home-final-cta"
    >
      <div className="site-shell home-final-cta-inner">
        <h2
          id="home-final-cta-heading"
          className="home-final-cta-heading"
        >
          {heading}
        </h2>

        <p className="home-final-cta-sub">{sub}</p>

        <ButtonLink
          href="/back"
          variant="primary"
          glow
          className="home-final-cta-button"
        >
          {ctaLabel}

          <ArrowRight
            aria-hidden
            size={17}
            strokeWidth={1.8}
          />
        </ButtonLink>
      </div>
    </section>
  );
}
