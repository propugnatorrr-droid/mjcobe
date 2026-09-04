import { describe, expect, it } from 'vitest';
import { inventoryAdjustmentDecision } from '@/lib/shop/inventory-decision';

describe('inventoryAdjustmentDecision', () => {
  it('grants a positive restock', () => {
    expect(inventoryAdjustmentDecision({ currentStock: 10, delta: 5 })).toEqual({ ok: true, newStock: 15 });
  });

  it('grants a negative adjustment that keeps stock at or above zero', () => {
    expect(inventoryAdjustmentDecision({ currentStock: 10, delta: -10 })).toEqual({ ok: true, newStock: 0 });
  });

  it('rejects a negative adjustment that would take stock below zero', () => {
    const result = inventoryAdjustmentDecision({ currentStock: 5, delta: -6 });
    expect(result).toEqual({ ok: false, reason: 'insufficient_stock' });
  });

  it('rejects a zero delta', () => {
    expect(inventoryAdjustmentDecision({ currentStock: 10, delta: 0 })).toEqual({ ok: false, reason: 'invalid_delta' });
  });

  it('rejects a non-integer delta', () => {
    expect(inventoryAdjustmentDecision({ currentStock: 10, delta: 1.5 })).toEqual({ ok: false, reason: 'invalid_delta' });
  });

  it('rejects NaN (e.g. unparseable form input)', () => {
    expect(inventoryAdjustmentDecision({ currentStock: 10, delta: NaN })).toEqual({ ok: false, reason: 'invalid_delta' });
  });

  it('never silently clamps a negative result to zero — it rejects instead', () => {
    const result = inventoryAdjustmentDecision({ currentStock: 0, delta: -1 });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('insufficient_stock');
  });
});
