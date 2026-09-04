import { signCredential, verifyCredential } from '@/lib/security/signed-credential';

/**
 * Ticket admission credential — HMAC-signed deterministic, per the plan's
 * approval correction (see lib/security/signed-credential.ts's header
 * comment). This is the QR payload and the URL token for
 * /tickets/[secureToken]. Uses its own secret, distinct from
 * ORDER_SIGNING_SECRET (lib/commerce/order-credentials.ts) — a leaked
 * order-confirmation secret must never be usable to forge a physical
 * admission credential, and vice versa.
 */
function secret(): string {
  const value = process.env.TICKET_SIGNING_SECRET;
  if (!value) {
    throw new Error('TICKET_SIGNING_SECRET is not configured.');
  }
  return value;
}

export function ticketCredential(ticketId: string, credentialVersion: number): string {
  return signCredential(ticketId, credentialVersion, secret());
}

export function verifyTicketCredential(token: string): { ticketId: string; credentialVersion: number } | null {
  const verified = verifyCredential(token, secret());
  if (!verified) return null;
  return { ticketId: verified.id, credentialVersion: verified.version };
}
