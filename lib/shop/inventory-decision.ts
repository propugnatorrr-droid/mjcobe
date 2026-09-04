/**
 * Pure decision function for a stock adjustment — split out so it's
 * unit-testable without a database, matching this repo's convention (see
 * lib/commerce/reservation-decision.ts for the equivalent pattern in the
 * ticket-capacity domain). `stockOnHand` is the one authoritative
 * quantity per the plan's approval correction; this function is what
 * lib/shop/admin-actions.ts's adjustInventory() calls inside the same
 * transaction that also inserts the inventory_movements row — a negative
 * resulting stock is rejected outright, never silently clamped to zero.
 */
export type InventoryAdjustmentDecision =
  | { ok: true; newStock: number }
  | { ok: false; reason: 'invalid_delta' | 'insufficient_stock' };

export function inventoryAdjustmentDecision(input: { currentStock: number; delta: number }): InventoryAdjustmentDecision {
  if (!Number.isInteger(input.delta) || input.delta === 0) {
    return { ok: false, reason: 'invalid_delta' };
  }

  const newStock = input.currentStock + input.delta;
  if (newStock < 0) {
    return { ok: false, reason: 'insufficient_stock' };
  }

  return { ok: true, newStock };
}
