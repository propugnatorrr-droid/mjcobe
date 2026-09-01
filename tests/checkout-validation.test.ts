import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  normalizeEmail,
  parseAmountCents,
} from '@/lib/checkout/validate';

describe(
  'checkout amount validation',
  () => {
    it(
      'parses whole-dollar amounts',
      () => {
        expect(
          parseAmountCents('25'),
        ).toBe(2500);
      },
    );

    it(
      'parses one decimal place',
      () => {
        expect(
          parseAmountCents('25.5'),
        ).toBe(2550);
      },
    );

    it(
      'parses two decimal places',
      () => {
        expect(
          parseAmountCents('25.05'),
        ).toBe(2505);
      },
    );

    it(
      'parses an amount below one dollar',
      () => {
        expect(
          parseAmountCents('.50'),
        ).toBe(50);
      },
    );

    it(
      'trims surrounding whitespace',
      () => {
        expect(
          parseAmountCents(' 25.00 '),
        ).toBe(2500);
      },
    );

    it.each([
      '',
      '0',
      '0.00',
      '-25',
      '+25',
      '$25',
      '1,000',
      '25.001',
      '1e3',
      '25 dollars',
      '.',
      'NaN',
      'Infinity',
    ])(
      'rejects malformed amount %s',
      (value) => {
        expect(
          parseAmountCents(value),
        ).toBeNull();
      },
    );

    it(
      'rejects non-string values',
      () => {
        expect(
          parseAmountCents(25),
        ).toBeNull();

        expect(
          parseAmountCents(null),
        ).toBeNull();
      },
    );
  },
);

describe(
  'checkout email validation',
  () => {
    it(
      'normalizes a valid email',
      () => {
        expect(
          normalizeEmail(
            '  FAN@Example.COM  ',
          ),
        ).toBe(
          'fan@example.com',
        );
      },
    );

    it.each([
      '',
      'fan',
      'fan@',
      '@example.com',
      'fan@example',
      'fan @example.com',
      'fan@example .com',
    ])(
      'rejects invalid email %s',
      (value) => {
        expect(
          normalizeEmail(value),
        ).toBeNull();
      },
    );

    it(
      'rejects emails longer than 254 characters',
      () => {
        const email =
          `${'a'.repeat(243)}@example.com`;

        expect(
          email.length,
        ).toBeGreaterThan(254);

        expect(
          normalizeEmail(email),
        ).toBeNull();
      },
    );
  },
);
