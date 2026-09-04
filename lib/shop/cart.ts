/**
 * The guest cart holds product/variant IDs and quantities only — NEVER a
 * price. Every price shown at checkout is re-read from the database at
 * render time (app/shop/checkout/page.tsx) and re-validated again inside
 * the checkout server action — client-held state is never trusted for
 * money, matching this codebase's loadPayableCampaign()/
 * loadPurchasableTicketType() discipline. Stored in a plain (unsigned)
 * cookie: tampering with quantity/variantId here is harmless precisely
 * because nothing here is trusted — the worst a forged cookie can do is
 * request an item that then fails the same server-side validation a
 * genuine cart would.
 *
 * Pure parsing/serialization only in this file (no cookie API access) so
 * it's usable from both Server Components (via next/headers cookies())
 * and the client cart button (via document.cookie), and unit-testable.
 */
export type CartLine = { variantId: string; quantity: number };

export const CART_COOKIE_NAME = 'mjcobe_cart';
const MAX_LINES = 20;
const MAX_QUANTITY_PER_LINE = 20;

export function parseCart(raw: string | undefined | null): CartLine[] {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const lines: CartLine[] = [];
  for (const entry of parsed) {
    if (
      entry &&
      typeof entry === 'object' &&
      typeof (entry as Record<string, unknown>).variantId === 'string' &&
      typeof (entry as Record<string, unknown>).quantity === 'number' &&
      Number.isInteger((entry as { quantity: number }).quantity) &&
      (entry as { quantity: number }).quantity > 0
    ) {
      lines.push({
        variantId: (entry as { variantId: string }).variantId,
        quantity: Math.min((entry as { quantity: number }).quantity, MAX_QUANTITY_PER_LINE),
      });
    }
    if (lines.length >= MAX_LINES) break;
  }

  return lines;
}

export function serializeCart(lines: CartLine[]): string {
  return JSON.stringify(lines.slice(0, MAX_LINES));
}

/** Adds a line, merging quantity into an existing line for the same
 * variant rather than creating a duplicate. */
export function addToCart(lines: CartLine[], addition: CartLine): CartLine[] {
  const existing = lines.find((line) => line.variantId === addition.variantId);
  if (existing) {
    return lines.map((line) =>
      line.variantId === addition.variantId
        ? { ...line, quantity: Math.min(line.quantity + addition.quantity, MAX_QUANTITY_PER_LINE) }
        : line,
    );
  }
  return [...lines, addition].slice(0, MAX_LINES);
}

export function removeFromCart(lines: CartLine[], variantId: string): CartLine[] {
  return lines.filter((line) => line.variantId !== variantId);
}
