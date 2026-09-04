import 'server-only';
import { settingOr } from '@/lib/config/settings';

/**
 * Shop checkout must stay blocked until an operator has explicitly decided
 * shipping, tax, refund policy, support contact, currency, and fulfillment
 * ownership — per this initiative's final acceptance audit (item 8): missing
 * configuration must never silently mean free shipping or no tax. Every key
 * here is DB-only (no entry in lib/config/defaults.ts's configDefaults), so
 * `settingOr(key, null)` returns `null` — genuinely "never configured" —
 * until an admin sets it via the existing generic /admin/settings page. A
 * deliberately-chosen value of 0 (e.g. "shipping really is free") is not the
 * same as an unset value and is accepted once explicitly saved.
 */
export type ShopCommerceConfig = {
  supportEmail: string;
  refundPolicyUrl: string;
  fulfillmentOwnerEmail: string;
  currency: string;
  shippingRegions: string;
  flatShippingCents: number;
  taxRatePercent: number;
};

export async function loadShopCommerceConfig(): Promise<ShopCommerceConfig | null> {
  const [supportEmail, refundPolicyUrl, fulfillmentOwnerEmail, currency, shippingRegions, flatShippingCentsRaw, taxRatePercentRaw] =
    await Promise.all([
      settingOr<string | null>('shopSupportEmail', null),
      settingOr<string | null>('shopRefundPolicyUrl', null),
      settingOr<string | null>('shopFulfillmentOwnerEmail', null),
      settingOr<string | null>('shopCurrency', null),
      settingOr<string | null>('shopShippingRegions', null),
      settingOr<number | null>('shopFlatShippingCents', null),
      settingOr<number | null>('shopTaxRatePercent', null),
    ]);

  if (
    !supportEmail?.trim() ||
    !refundPolicyUrl?.trim() ||
    !fulfillmentOwnerEmail?.trim() ||
    !currency?.trim() ||
    !shippingRegions?.trim() ||
    flatShippingCentsRaw === null ||
    taxRatePercentRaw === null ||
    !Number.isFinite(flatShippingCentsRaw) ||
    !Number.isFinite(taxRatePercentRaw) ||
    flatShippingCentsRaw < 0 ||
    taxRatePercentRaw < 0
  ) {
    return null;
  }

  return {
    supportEmail: supportEmail.trim(),
    refundPolicyUrl: refundPolicyUrl.trim(),
    fulfillmentOwnerEmail: fulfillmentOwnerEmail.trim(),
    currency: currency.trim(),
    shippingRegions: shippingRegions.trim(),
    flatShippingCents: flatShippingCentsRaw,
    taxRatePercent: taxRatePercentRaw,
  };
}

/** Pure so it's unit-testable without a DB — the money math for a given
 * config + subtotal, never trusted from the client. */
export function computeShopCharges(config: ShopCommerceConfig, subtotalCents: number, needsShipping: boolean): { taxCents: number; shippingCents: number } {
  const shippingCents = needsShipping ? config.flatShippingCents : 0;
  const taxCents = Math.round((subtotalCents * config.taxRatePercent) / 100);
  return { taxCents, shippingCents };
}
