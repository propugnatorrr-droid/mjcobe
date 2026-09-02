import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SectionHeading } from '@/components/primitives/SectionHeading';
import type { PartnerSponsor } from '@/lib/partners/queries';

type PartnerStripProps = {
  partners: PartnerSponsor[];
  heading: string;
  cta: string;
};

export function PartnerStrip({
  partners,
  heading,
  cta,
}: PartnerStripProps) {
  if (partners.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="home-partners-heading"
      className="home-partner-strip"
    >
      <div className="site-shell">
        <div className="home-partner-strip-heading">
          <div id="home-partners-heading">
            <SectionHeading>{heading}</SectionHeading>
          </div>

          <Link
            href="/partners"
            className="home-partner-strip-view-all"
          >
            <span>{cta}</span>

            <ArrowUpRight
              aria-hidden
              size={15}
              strokeWidth={1.8}
            />
          </Link>
        </div>

        <div className="home-partner-strip-row">
          {partners.map((partner) => (
            <Link
              key={partner.id}
              href={`/partner/${partner.slug}`}
              className="home-partner-strip-item"
            >
              {partner.logoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={partner.logoPath}
                  alt=""
                  width={32}
                  height={32}
                  className="home-partner-strip-logo"
                />
              ) : null}

              <span>{partner.businessName}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
