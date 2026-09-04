'use client';

import { useRouter } from 'next/navigation';
import { CART_COOKIE_NAME, parseCart, serializeCart, removeFromCart } from '@/lib/shop/cart';

function readCartCookie(): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CART_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function writeCartCookie(raw: string) {
  document.cookie = `${CART_COOKIE_NAME}=${encodeURIComponent(raw)}; path=/; max-age=${60 * 60 * 24 * 30}`;
}

export function RemoveFromCartButton({ variantId, label }: { variantId: string; label: string }) {
  const router = useRouter();

  function handleClick() {
    const current = parseCart(readCartCookie());
    writeCartCookie(serializeCart(removeFromCart(current, variantId)));
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)] transition-colors hover:text-[var(--champagne)]"
    >
      {label}
    </button>
  );
}
