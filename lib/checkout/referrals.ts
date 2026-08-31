import 'server-only';

import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { cookies } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';

export const REFERRAL_COOKIE =
  'mjcobe_referral';

export const REFERRAL_SESSION_COOKIE =
  'mjcobe_referral_session';

export const REFERRAL_TTL_SECONDS =
  60 * 60 * 24 * 30;

type ReferralCookiePayload = {
  referralLinkId: string;
  campaignId: string;
  expiresAt: number;
};

function secret(): string {
  const value =
    process.env.REFERRAL_COOKIE_SECRET?.trim();

  if (!value) {
    throw new Error(
      'REFERRAL_COOKIE_SECRET is required.',
    );
  }

  return value;
}

function encode(
  value: string,
): string {
  return Buffer.from(
    value,
    'utf8',
  ).toString('base64url');
}

function decode(
  value: string,
): string {
  return Buffer.from(
    value,
    'base64url',
  ).toString('utf8');
}

function signature(
  encodedPayload: string,
): string {
  return createHmac(
    'sha256',
    secret(),
  )
    .update(encodedPayload)
    .digest('base64url');
}

function signaturesMatch(
  left: string,
  right: string,
): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);

  return (
    a.length === b.length &&
    timingSafeEqual(a, b)
  );
}

export function createReferralCookie(
  input: {
    referralLinkId: string;
    campaignId: string;
    now?: Date;
  },
): string {
  const now =
    input.now ?? new Date();

  const payload:
    ReferralCookiePayload = {
      referralLinkId:
        input.referralLinkId,
      campaignId:
        input.campaignId,
      expiresAt:
        now.getTime() +
        REFERRAL_TTL_SECONDS *
          1000,
    };

  const encoded =
    encode(
      JSON.stringify(payload),
    );

  return `${encoded}.${signature(encoded)}`;
}

export function parseReferralCookie(
  token: string,
  now = new Date(),
): ReferralCookiePayload | null {
  const [
    encodedPayload,
    receivedSignature,
  ] = token.split('.');

  if (
    !encodedPayload ||
    !receivedSignature
  ) {
    return null;
  }

  const expectedSignature =
    signature(encodedPayload);

  if (
    !signaturesMatch(
      receivedSignature,
      expectedSignature,
    )
  ) {
    return null;
  }

  try {
    const payload =
      JSON.parse(
        decode(encodedPayload),
      ) as Partial<ReferralCookiePayload>;

    if (
      typeof payload.referralLinkId !==
        'string' ||
      typeof payload.campaignId !==
        'string' ||
      typeof payload.expiresAt !==
        'number' ||
      payload.expiresAt <=
        now.getTime()
    ) {
      return null;
    }

    return {
      referralLinkId:
        payload.referralLinkId,
      campaignId:
        payload.campaignId,
      expiresAt:
        payload.expiresAt,
    };
  } catch {
    return null;
  }
}

export function newReferralSessionId():
  string {
  return randomUUID();
}

/**
 * Referral identity is always resolved from
 * the signed first-party cookie. Checkout
 * never accepts a referral ID from FormData.
 */
export async function referralLinkForCampaign(
  campaignId: string,
): Promise<string | null> {
  const jar = await cookies();

  const token =
    jar.get(
      REFERRAL_COOKIE,
    )?.value;

  if (!token) {
    return null;
  }

  const payload =
    parseReferralCookie(token);

  if (
    !payload ||
    payload.campaignId !==
      campaignId
  ) {
    return null;
  }

  const [link] =
    await db
      .select({
        id:
          s.referralLinks.id,
      })
      .from(
        s.referralLinks,
      )
      .where(
        and(
          eq(
            s.referralLinks.id,
            payload.referralLinkId,
          ),
          eq(
            s.referralLinks.campaignId,
            campaignId,
          ),
        ),
      )
      .limit(1);

  return link?.id ?? null;
}
