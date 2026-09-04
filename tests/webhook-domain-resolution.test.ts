import { describe, expect, it } from 'vitest';
import { classifyPaymentOwnership } from '@/lib/payments/payment-ownership';

describe('classifyPaymentOwnership', () => {
  it('resolves to the contribution domain when only a transaction matches', () => {
    const result = classifyPaymentOwnership('pi_123', { id: 'txn_1' }, null);
    expect(result).toEqual({ domain: 'contribution', transactionId: 'txn_1' });
  });

  it('resolves to the commerce domain when only a payment matches', () => {
    const result = classifyPaymentOwnership('pi_123', null, { id: 'pay_1', orderId: 'order_1' });
    expect(result).toEqual({ domain: 'commerce', paymentId: 'pay_1', orderId: 'order_1' });
  });

  it('resolves to none when neither matches', () => {
    const result = classifyPaymentOwnership('pi_123', null, null);
    expect(result).toEqual({ domain: 'none' });
  });

  it('throws — never guesses — when both a transaction and a payment match the same reference', () => {
    expect(() => classifyPaymentOwnership('pi_123', { id: 'txn_1' }, { id: 'pay_1', orderId: 'order_1' })).toThrow(
      /Ambiguous payment ownership/,
    );
  });
});
