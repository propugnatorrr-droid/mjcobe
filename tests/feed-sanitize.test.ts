import { describe, expect, it } from 'vitest';
import { normalizeExternalUrl } from '@/lib/feed/sanitize';

describe('normalizeExternalUrl', () => {
  it('accepts a well-formed https URL', () => {
    expect(normalizeExternalUrl('https://example.com/promo')).toBe('https://example.com/promo');
  });

  it('rejects javascript: URLs', () => {
    expect(normalizeExternalUrl('javascript:alert(1)')).toBeNull();
  });

  it('rejects data: URLs', () => {
    expect(normalizeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('rejects plain http (non-https)', () => {
    expect(normalizeExternalUrl('http://example.com')).toBeNull();
  });

  it('rejects malformed input', () => {
    expect(normalizeExternalUrl('not a url')).toBeNull();
  });

  it('rejects empty/whitespace input', () => {
    expect(normalizeExternalUrl('   ')).toBeNull();
  });

  it('rejects null/undefined', () => {
    expect(normalizeExternalUrl(null)).toBeNull();
    expect(normalizeExternalUrl(undefined)).toBeNull();
  });
});
