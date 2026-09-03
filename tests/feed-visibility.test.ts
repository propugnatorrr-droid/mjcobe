import { describe, expect, it } from 'vitest';
import { isPubliclyVisible } from '@/lib/feed/visibility';

const NOW = new Date('2026-06-01T12:00:00Z');

function post(overrides: Partial<{ moderation: string; publishedAt: Date | null; expiresAt: Date | null }> = {}) {
  return {
    moderation: 'approved',
    publishedAt: new Date('2026-05-01T00:00:00Z'),
    expiresAt: null,
    ...overrides,
  };
}

function sponsor(moderation = 'approved') {
  return { moderation };
}

describe('feed post visibility', () => {
  it('is visible when approved, published in the past, sponsor approved, no expiry', () => {
    expect(isPubliclyVisible(post(), sponsor(), NOW)).toBe(true);
  });

  it('is hidden while the post itself is pending', () => {
    expect(isPubliclyVisible(post({ moderation: 'pending' }), sponsor(), NOW)).toBe(false);
  });

  it('is hidden when rejected (blocked)', () => {
    expect(isPubliclyVisible(post({ moderation: 'blocked' }), sponsor(), NOW)).toBe(false);
  });

  it('is hidden when the admin has hidden it', () => {
    expect(isPubliclyVisible(post({ moderation: 'hidden' }), sponsor(), NOW)).toBe(false);
  });

  it('is hidden when the sponsor is blocked, even if the post is approved', () => {
    expect(isPubliclyVisible(post(), sponsor('blocked'), NOW)).toBe(false);
  });

  it('is hidden when the sponsor is only pending', () => {
    expect(isPubliclyVisible(post(), sponsor('pending'), NOW)).toBe(false);
  });

  it('is hidden when scheduled for the future', () => {
    const scheduled = post({ publishedAt: new Date('2026-06-02T00:00:00Z') });
    expect(isPubliclyVisible(scheduled, sponsor(), NOW)).toBe(false);
  });

  it('is visible the instant publishedAt is reached', () => {
    const justPublished = post({ publishedAt: NOW });
    expect(isPubliclyVisible(justPublished, sponsor(), NOW)).toBe(true);
  });

  it('is hidden when publishedAt has never been set (still pending approval)', () => {
    expect(isPubliclyVisible(post({ publishedAt: null }), sponsor(), NOW)).toBe(false);
  });

  it('is visible when expiresAt is in the future', () => {
    const notYetExpired = post({ expiresAt: new Date('2026-06-02T00:00:00Z') });
    expect(isPubliclyVisible(notYetExpired, sponsor(), NOW)).toBe(true);
  });

  it('is hidden once expiresAt has passed', () => {
    const expired = post({ expiresAt: new Date('2026-05-31T00:00:00Z') });
    expect(isPubliclyVisible(expired, sponsor(), NOW)).toBe(false);
  });

  it('is hidden exactly at the expiry instant (expiresAt is exclusive)', () => {
    const expiringNow = post({ expiresAt: NOW });
    expect(isPubliclyVisible(expiringNow, sponsor(), NOW)).toBe(false);
  });

  it('requires both post and sponsor approval simultaneously, not either alone', () => {
    expect(isPubliclyVisible(post({ moderation: 'approved' }), sponsor('flagged'), NOW)).toBe(false);
    expect(isPubliclyVisible(post({ moderation: 'flagged' }), sponsor('approved'), NOW)).toBe(false);
  });
});
