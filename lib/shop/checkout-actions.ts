'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { str, bool, normalizeEmail } from '@/lib/checkout/validate';
import { CART_COOKIE_NAME, parseCart } from '@/lib/shop/cart';
import { reserveProductStock } from '@/lib/shop/reservations';
import { getVariantForCheckout } from '@/lib/shop/queries';
import { createOrder, settleOrder, type CreateOrderItemInput } from '@/lib/commerce/orders';
import { flagEnabled } from '@/lib/config/settings';

export type ShopCheckoutState = {
  error?: string;
  payment?: { clientSecret: string; returnPath: string };
};

const CHECKOUT_ATTEMPT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function checkoutAttemptKey(formData: FormData): string | null {
  const attemptId = str(formData.get('checkoutAttemptKey'), 36);
  if (!attemptId || !CHECKOUT_ATTEMPT_RE.test(attemptId)) return null;
  return `shop:${attemptId}`;
}

export async function purchaseShopOrder(_prev: ShopCheckoutState, formData: FormData): Promise<ShopCheckoutState> {
  if (str(formData.get('company_website_confirm'))) {
    return { error: 'blocked' };
  }

  if (!(await flagEnabled('shopEnabled'))) {
    return { error: 'unavailable' };
  }

  const idempotencyKey = checkoutAttemptKey(formData);
  if (!idempotencyKey) return { error: 'generic' };

  const cookieStore = await cookies();
  const cart = parseCart(cookieStore.get(CART_COOKIE_NAME)?.value);
  if (cart.length === 0) return { error: 'unavailable' };

  const email = normalizeEmail(formData.get('email'));
  if (!email) return { error: 'email' };

  if (!bool(formData.get('consent'))) return { error: 'consent' };

  const purchasable = await Promise.all(cart.map((line) => getVariantForCheckout(line.variantId)));
  if (purchasable.some((row) => !row)) return { error: 'unavailable' };
  const rows = purchasable as NonNullable<(typeof purchasable)[number]>[];

  const needsShipping = rows.some((row) => row.shippingRequired);

  let shippingAddress: { recipientName: string; line1: string; line2: string | null; city: string; region: string | null; postalCode: string; country: string } | undefined;

  if (needsShipping) {
    const recipientName = str(formData.get('recipientName'), 200);
    const line1 = str(formData.get('line1'), 200);
    const city = str(formData.get('city'), 100);
    const postalCode = str(formData.get('postalCode'), 20);
    const country = str(formData.get('country'), 100);
    if (!recipientName || !line1 || !city || !postalCode || !country) {
      return { error: 'address' };
    }
    shippingAddress = {
      recipientName,
      line1,
      line2: str(formData.get('line2'), 200),
      city,
      region: str(formData.get('region'), 100),
      postalCode,
      country,
    };
  }

  const reservationIds: string[] = [];
  for (let i = 0; i < cart.length; i += 1) {
    const reservation = await reserveProductStock({ variantId: cart[i]!.variantId, quantity: cart[i]!.quantity });
    if (!reservation.ok) {
      return { error: reservation.reason === 'insufficient_stock' ? 'sold_out' : 'unavailable' };
    }
    reservationIds.push(reservation.reservationId);
  }

  const items: CreateOrderItemInput[] = rows.map((row, i) => ({
    itemType: 'product_variant',
    referenceId: row.variantId,
    titleSnapshot: `${row.productTitle} — ${row.variantName}`,
    unitPriceCents: row.priceCents,
    quantity: cart[i]!.quantity,
  }));

  let orderResult: Awaited<ReturnType<typeof createOrder>>;
  try {
    orderResult = await createOrder({
      orderType: 'shop',
      buyerEmail: email,
      items,
      reservationIds,
      idempotencyKey,
      description: 'MJ COBE shop order',
      shippingAddress,
    });
  } catch {
    return { error: 'generic' };
  }

  // Cart is cleared once the order exists — even before payment settles —
  // matching how a real cart is "spent" the moment checkout is submitted;
  // a failed/abandoned payment doesn't restore it (the reservation's own
  // expiry releases the stock either way).
  cookieStore.delete(CART_COOKIE_NAME);

  if (orderResult.clientSecret) {
    return {
      payment: {
        clientSecret: orderResult.clientSecret,
        returnPath: `/orders/${orderResult.secureToken}`,
      },
    };
  }

  const settled = await settleOrder(orderResult.paymentId);
  if (!settled.ok) {
    return { error: settled.code === 'pending' ? 'generic' : 'declined' };
  }

  redirect(`/orders/${orderResult.secureToken}`);
}
