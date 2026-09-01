import { describe, expect, it } from 'vitest';
import {
  reconcileAction,
} from '@/lib/reconciliation/audit';

const base = {
  localState: 'authorized',
  providerState: 'requires_capture',
  ledgerCents: 0,
  amountCents: 10_000,
  ageHours: 1,
};

describe('reconcileAction', () => {
  it('does nothing when the provider is unreachable', () => {
    expect(
      reconcileAction({
        ...base,
        providerState: null,
        ledgerCents: 0,
      }),
    ).toBe('none');
  });

  it('never acts on silence even when money looks missing', () => {
    expect(
      reconcileAction({
        ...base,
        localState: 'captured',
        providerState: null,
      }),
    ).toBe('none');
  });

  it('settles a succeeded payment with no ledger entry', () => {
    expect(
      reconcileAction({
        ...base,
        providerState: 'succeeded',
      }),
    ).toBe('settle');
  });

  it('leaves a correctly settled payment alone', () => {
    expect(
      reconcileAction({
        ...base,
        localState: 'settled',
        providerState: 'succeeded',
        ledgerCents: 10_000,
      }),
    ).toBe('none');
  });

  it('escalates a settled payment whose amounts disagree', () => {
    expect(
      reconcileAction({
        ...base,
        localState: 'settled',
        providerState: 'succeeded',
        ledgerCents: 9_000,
      }),
    ).toBe('escalate');
  });

  it('corrects a ledger still counting refunded money', () => {
    expect(
      reconcileAction({
        ...base,
        localState: 'settled',
        providerState: 'refunded',
        ledgerCents: 10_000,
      }),
    ).toBe('refund_ledger');
  });

  it('leaves an already-corrected refund alone', () => {
    expect(
      reconcileAction({
        ...base,
        localState: 'refunded',
        providerState: 'refunded',
        ledgerCents: 0,
      }),
    ).toBe('none');
  });

  it('marks a failed payment failed', () => {
    expect(
      reconcileAction({
        ...base,
        providerState: 'failed',
      }),
    ).toBe('mark_failed');
  });

  it('does not re-mark an already failed transaction', () => {
    expect(
      reconcileAction({
        ...base,
        localState: 'failed',
        providerState: 'failed',
      }),
    ).toBe('none');
  });

  it('escalates money we count that the provider does not report', () => {
    expect(
      reconcileAction({
        ...base,
        localState: 'settled',
        providerState: 'requires_payment_method',
        ledgerCents: 10_000,
      }),
    ).toBe('escalate');
  });

  it('escalates an authorization about to expire', () => {
    expect(
      reconcileAction({
        ...base,
        ageHours: 150,
      }),
    ).toBe('escalate');
  });

  it('leaves a fresh authorization alone', () => {
    expect(
      reconcileAction({ ...base, ageHours: 2 }),
    ).toBe('none');
  });

  it('never marks failed while money is counted', () => {
    expect(
      reconcileAction({
        ...base,
        providerState: 'failed',
        ledgerCents: 10_000,
      }),
    ).not.toBe('mark_failed');
  });

  it('treats captured as money having moved', () => {
    expect(
      reconcileAction({
        ...base,
        providerState: 'captured',
      }),
    ).toBe('settle');
  });
});
