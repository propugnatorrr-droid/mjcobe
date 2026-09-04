import { describe, expect, it } from 'vitest';
import { parseCart, addToCart, removeFromCart } from '@/lib/shop/cart';

describe('parseCart', () => {
  it('parses a well-formed cart', () => {
    expect(parseCart('[{"variantId":"a","quantity":2}]')).toEqual([{ variantId: 'a', quantity: 2 }]);
  });

  it('returns empty for null/undefined/empty input', () => {
    expect(parseCart(null)).toEqual([]);
    expect(parseCart(undefined)).toEqual([]);
    expect(parseCart('')).toEqual([]);
  });

  it('returns empty for malformed JSON rather than throwing', () => {
    expect(parseCart('not json {{{')).toEqual([]);
  });

  it('returns empty when the JSON parses but is not an array', () => {
    expect(parseCart('{"variantId":"a","quantity":2}')).toEqual([]);
  });

  it('drops entries with a non-string variantId', () => {
    expect(parseCart('[{"variantId":123,"quantity":1}]')).toEqual([]);
  });

  it('drops entries with a non-positive or non-integer quantity', () => {
    expect(parseCart('[{"variantId":"a","quantity":0}]')).toEqual([]);
    expect(parseCart('[{"variantId":"a","quantity":-1}]')).toEqual([]);
    expect(parseCart('[{"variantId":"a","quantity":1.5}]')).toEqual([]);
  });

  it('caps a single line quantity rather than trusting an absurd value', () => {
    const result = parseCart('[{"variantId":"a","quantity":999999}]');
    expect(result[0]?.quantity).toBeLessThanOrEqual(20);
  });

  it('caps the number of lines rather than trusting an unbounded array', () => {
    const lines = Array.from({ length: 50 }, (_, i) => ({ variantId: `v${i}`, quantity: 1 }));
    const result = parseCart(JSON.stringify(lines));
    expect(result.length).toBeLessThanOrEqual(20);
  });
});

describe('addToCart', () => {
  it('adds a new line', () => {
    expect(addToCart([], { variantId: 'a', quantity: 1 })).toEqual([{ variantId: 'a', quantity: 1 }]);
  });

  it('merges quantity into an existing line for the same variant', () => {
    const result = addToCart([{ variantId: 'a', quantity: 1 }], { variantId: 'a', quantity: 2 });
    expect(result).toEqual([{ variantId: 'a', quantity: 3 }]);
  });

  it('caps the merged quantity', () => {
    const result = addToCart([{ variantId: 'a', quantity: 15 }], { variantId: 'a', quantity: 15 });
    expect(result[0]?.quantity).toBeLessThanOrEqual(20);
  });
});

describe('removeFromCart', () => {
  it('removes the matching line and leaves others intact', () => {
    const result = removeFromCart(
      [
        { variantId: 'a', quantity: 1 },
        { variantId: 'b', quantity: 2 },
      ],
      'a',
    );
    expect(result).toEqual([{ variantId: 'b', quantity: 2 }]);
  });

  it('is a no-op when the variant is not in the cart', () => {
    const lines = [{ variantId: 'a', quantity: 1 }];
    expect(removeFromCart(lines, 'z')).toEqual(lines);
  });
});
