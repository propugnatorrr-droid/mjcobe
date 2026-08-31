import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Disc3,
} from 'lucide-react';
import { ButtonLink } from '@/components/primitives/Button';
import type {
  CheckoutSong,
  OpenCampaign,
} from '@/lib/checkout/queries';

type CheckoutUnavailableProps = {
  song: CheckoutSong | null;
  campaigns: OpenCampaign[];
  labels: {
    eyebrow: string;
    title: string;
    body: string;
    choose: string;
    viewSong: string;
  };
};

export function CheckoutUnavailable({
  song,
  campaigns,
  labels,
}: CheckoutUnavailableProps) {
  return (
    <section className="checkout-unavailable">
      <div
        aria-hidden
        className="checkout-unavailable__icon"
      >
        <Disc3
          size={28}
          strokeWidth={1.5}
        />
      </div>

      <p className="checkout-unavailable__eyebrow">
        {labels.eyebrow}
      </p>

      <h1 className="checkout-unavailable__title">
        {labels.title}
      </h1>

      <p className="checkout-unavailable__body">
        {labels.body}
      </p>

      {song ? (
        <ButtonLink
          href={`/song/${song.songSlug}`}
          variant="ghost"
          className="checkout-unavailable__journey"
        >
          <ArrowLeft
            aria-hidden
            size={15}
          />
          {labels.viewSong}
        </ButtonLink>
      ) : null}

      {campaigns.length > 0 ? (
        <div className="checkout-unavailable__options">
          <p>{labels.choose}</p>

          <div>
            {campaigns.map((campaign) => (
              <Link
                key={campaign.campaignId}
                href={`/back?song=${campaign.songSlug}`}
              >
                <span>{campaign.songTitle}</span>

                <ArrowRight
                  aria-hidden
                  size={15}
                />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
