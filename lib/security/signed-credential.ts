import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * A regenerable, deterministic bearer credential: `id.version.signature`,
 * where `signature = HMAC-SHA256(secret, "${id}.${version}")`. Nothing is
 * stored beyond an integer `credentialVersion` on the owning row — the
 * credential itself is recomputed on demand, not looked up.
 *
 * This is the correction the plan's approval added on top of the
 * original hash-only design: a hash-only credential (store `sha256(token)`,
 * discard the plaintext) can't support "resend the confirmation" or
 * "regenerate the QR code" once the plaintext is gone, because there's no
 * way to reconstruct what was hashed. An HMAC-signed deterministic
 * credential sidesteps that entirely — resend/regenerate just recomputes
 * the same signature from the same `(id, version)` pair, no plaintext to
 * lose. Bumping `credentialVersion` is also how a lost/compromised
 * credential gets invalidated: every previously issued signature for the
 * old version stops verifying the instant the row's version changes,
 * without needing a separate revocation list.
 *
 * Two independent domains use this (tickets, order confirmations), each
 * with its own secret — see lib/tickets/credentials.ts and
 * lib/commerce/order-credentials.ts. Domain separation is via distinct
 * secrets, not a shared key with a prefixed payload, so a credential
 * minted for one domain can never verify against the other even if a
 * secret were somehow reused by mistake.
 */
export function signCredential(id: string, version: number, secret: string): string {
  const payload = `${id}.${version}`;
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${id}.${version}.${signature}`;
}

export type VerifiedCredential = { id: string; version: number };

export function verifyCredential(token: string, secret: string): VerifiedCredential | null {
  if (typeof token !== 'string' || token.length === 0 || token.length > 300) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [id, versionRaw, signature] = parts;
  if (!id || !signature) return null;

  const version = Number(versionRaw);
  if (!Number.isInteger(version) || version < 0) return null;

  const expected = createHmac('sha256', secret).update(`${id}.${version}`).digest('base64url');

  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  // timingSafeEqual throws on mismatched lengths rather than returning
  // false — a length mismatch is itself a conclusive "invalid", so it's
  // checked first rather than caught as an exception.
  if (provided.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(provided, expectedBuffer)) return null;

  return { id, version };
}
