import { describe, expect, it } from 'vitest';
import { cents, formatCents } from './cents';

describe('formatCents', () => {
  it('renders zero as a whole dollar amount', () => {
    expect(formatCents(cents(0))).toBe('$0');
  });

  it('renders a round amount with no cents', () => {
    expect(formatCents(cents(1_842_000))).toBe('$18,420');
  });

  it('renders one cent with two decimal places', () => {
    expect(formatCents(cents(1))).toBe('$0.01');
  });

  it('renders a non-round amount with its cents remainder', () => {
    expect(formatCents(cents(3_750))).toBe('$37.50');
  });

  it('renders a round negative amount with no cents', () => {
    expect(formatCents(cents(-500))).toBe('-$5');
  });

  it('renders a large amount with grouping separators', () => {
    expect(formatCents(cents(123_456_789_00))).toBe('$123,456,789');
  });
});
