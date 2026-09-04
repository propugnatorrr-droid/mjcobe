import { signCredential, verifyCredential } from '@/lib/security/signed-credential';

/**
 * Order-confirmation link credential — HMAC-signed deterministic, per the
 * correction the plan's approval applied to both ticket credentials AND
 * order-confirmation links (see lib/security/signed-credential.ts's
 * header comment for the full rationale). Nothing is stored beyond
 * `commerce_orders.credential_version`; the URL token is recomputed on
 * demand, never looked up by a stored value.
 */
function secret(): string {
  const value = process.env.ORDER_SIGNING_SECRET;
  if (!value) {
    throw new Error('ORDER_SIGNING_SECRET is not configured.');
  }
  return value;
}

export function orderConfirmationToken(orderId: string, credentialVersion: number): string {
  return signCredential(orderId, credentialVersion, secret());
}

export function verifyOrderConfirmationToken(token: string): { orderId: string; credentialVersion: number } | null {
  const verified = verifyCredential(token, secret());
  if (!verified) return null;
  return { orderId: verified.id, credentialVersion: verified.version };
}
