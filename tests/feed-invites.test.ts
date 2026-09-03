import { describe, expect, it } from 'vitest';
import { isInviteUsable, type InviteRecord } from '@/lib/feed/invite-eligibility';

const NOW = new Date('2026-06-01T12:00:00Z');

function invite(overrides: Partial<InviteRecord> = {}): InviteRecord {
  return {
    expiresAt: new Date('2026-07-01T00:00:00Z'),
    revokedAt: null,
    usedAt: null,
    ...overrides,
  };
}

describe('submission invite eligibility', () => {
  it('is usable when unexpired, unrevoked, unused, sponsor approved', () => {
    expect(isInviteUsable(invite(), 'approved', NOW)).toBe(true);
  });

  it('rejects an expired invite (token reuse cannot resurrect it)', () => {
    expect(isInviteUsable(invite({ expiresAt: new Date('2026-05-01T00:00:00Z') }), 'approved', NOW)).toBe(false);
  });

  it('rejects an invite at the exact expiry instant', () => {
    expect(isInviteUsable(invite({ expiresAt: NOW }), 'approved', NOW)).toBe(false);
  });

  it('rejects a revoked invite', () => {
    expect(isInviteUsable(invite({ revokedAt: new Date('2026-05-15T00:00:00Z') }), 'approved', NOW)).toBe(false);
  });

  it('rejects an already-used invite — this is what prevents token reuse', () => {
    expect(isInviteUsable(invite({ usedAt: new Date('2026-05-20T00:00:00Z') }), 'approved', NOW)).toBe(false);
  });

  it('rejects a valid, unused invite whose sponsor is no longer approved', () => {
    expect(isInviteUsable(invite(), 'blocked', NOW)).toBe(false);
  });

  it('rejects a valid, unused invite whose sponsor is only pending', () => {
    expect(isInviteUsable(invite(), 'pending', NOW)).toBe(false);
  });

  it('a revoked AND expired invite is still simply rejected, not double-counted or special-cased', () => {
    expect(
      isInviteUsable(
        invite({ revokedAt: new Date('2026-05-10T00:00:00Z'), expiresAt: new Date('2026-05-11T00:00:00Z') }),
        'approved',
        NOW,
      ),
    ).toBe(false);
  });
});

// Sponsor impersonation is prevented structurally, not by a runtime check
// this test could exercise in isolation: lib/feed/submission-actions.ts's
// submitBrandFeedPost never reads a sponsorId from form input at all — the
// post is always created with `sponsorId: invite.sponsorId`, a value that
// comes exclusively from validateSubmissionToken's DB lookup. There is no
// code path (see that file) through which a submitted form value could
// reach the post's sponsorId. Documented here rather than faked with a
// mock, since a mock of "the form has no such field" would just be
// asserting the test's own setup.
