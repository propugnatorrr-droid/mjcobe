import { ArrowRight, Play } from 'lucide-react';
import { LookbookImage } from '@/components/primitives/LookbookImage';
import { ButtonLink } from '@/components/primitives/Button';
import { PhotoTreatment } from '@/components/treatments/PhotoTreatment';
import { getLookbookImage } from '@/lib/lookbook/manifest';

type HeroImage = ReturnType<typeof getLookbookImage>;

type HomeHeroProps = {
  image: HeroImage;
  artistName: string;
  tagline: string;
  subcopy: string;
  listenLabel: string;
  ctaLabel: string;
};

export function HomeHero({
  image,
  artistName,
  tagline,
  subcopy,
  listenLabel,
  ctaLabel,
}: HomeHeroProps) {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className={[
        'relative isolate overflow-hidden',
        'min-h-[calc(100svh-var(--header-height-mobile))]',
        'lg:min-h-[calc(100svh-var(--header-height-desktop))]',
        'lg:max-h-[58rem]',
      ].join(' ')}
    >
      <div className="absolute inset-0 -z-20 bg-[var(--ink)]">
        <div className="absolute inset-0 lg:left-auto lg:w-[62%] xl:w-[58%]">
          <PhotoTreatment vignette grain fill>
            <LookbookImage
              asset={image}
              sizes="(min-width: 1280px) 58vw, (min-width: 1024px) 62vw, 100vw"
              priority
              className="home-hero-image absolute inset-0 h-full w-full object-cover"
              objectPosition="50% 22%"
            />
          </PhotoTreatment>
        </div>
      </div>

      <div
        aria-hidden
        className="home-hero-scrim pointer-events-none absolute inset-0 -z-10"
      />

      <div
        className={[
          'site-shell flex min-h-[calc(100svh-var(--header-height-mobile))]',
          'items-end pb-16 pt-28',
          'sm:pb-20',
          'lg:min-h-[calc(100svh-var(--header-height-desktop))]',
          'lg:items-center lg:pb-20 lg:pt-20',
        ].join(' ')}
      >
        <div className="w-full max-w-[54rem]">
          <p className="mb-5 font-ui text-[0.6875rem] font-medium uppercase tracking-[0.28em] text-[var(--champagne)]">
            {artistName}
          </p>

          <h1
            id="home-hero-heading"
            className={[
              'max-w-[11ch] font-display uppercase',
              'text-[clamp(4rem,15vw,7rem)]',
              'leading-[0.86] tracking-[-0.025em]',
              'text-[var(--text)]',
              'lg:text-[clamp(5.5rem,9vw,9.5rem)]',
            ].join(' ')}
          >
            {tagline}
          </h1>

          <p
            className={[
              'mt-7 max-w-[36rem]',
              'font-ui text-base leading-7 text-[var(--text-dim)]',
              'sm:text-lg sm:leading-8',
            ].join(' ')}
          >
            {subcopy}
          </p>

          <div className="mt-9 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
            <ButtonLink
              href="/music"
              variant="quiet"
              className="w-full min-[420px]:w-auto"
            >
              <Play aria-hidden size={15} fill="currentColor" />
              {listenLabel}
            </ButtonLink>

            <ButtonLink
              href="/back"
              variant="primary"
              glow
              className="w-full min-[420px]:w-auto"
            >
              {ctaLabel}
              <ArrowRight aria-hidden size={16} />
            </ButtonLink>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[var(--line)]"
      />
    </section>
  );
}
