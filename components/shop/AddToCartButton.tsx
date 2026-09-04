'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CART_COOKIE_NAME, parseCart, serializeCart, addToCart } from '@/lib/shop/cart';

function readCartCookie(): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CART_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function writeCartCookie(raw: string) {
  // 30 days, path=/ so it's readable from every route including the
  // Server Component checkout page's cookies() read.
  document.cookie = `${CART_COOKIE_NAME}=${encodeURIComponent(raw)}; path=/; max-age=${60 * 60 * 24 * 30}`;
}

export function AddToCartButton({ variantId, label, disabled }: { variantId: string; label: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function handleClick() {
    setPending(true);
    const current = parseCart(readCartCookie());
    const next = addToCart(current, { variantId, quantity: 1 });
    writeCartCookie(serializeCart(next));
    router.push('/shop/checkout');
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || pending}
      className="mj-button mj-button--primary w-fit disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}
