import { describe, expect, it } from 'vitest';
import { signCredential, verifyCredential } from '@/lib/security/signed-credential';

const SECRET = 'test-secret-do-not-use-in-production';
const OTHER_SECRET = 'a-completely-different-secret';

describe('signed credential (HMAC-signed deterministic, regenerable)', () => {
  it('round-trips: a signed credential verifies back to the same id and version', () => {
    const token = signCredential('ticket-123', 0, SECRET);
    expect(verifyCredential(token, SECRET)).toEqual({ id: 'ticket-123', version: 0 });
  });

  it('signing the same id/version twice produces the identical credential (deterministic, no stored state needed)', () => {
    const first = signCredential('order-abc', 3, SECRET);
    const second = signCredential('order-abc', 3, SECRET);
    expect(first).toBe(second);
  });

  it('bumping the version invalidates every credential signed under the old version', () => {
    const oldToken = signCredential('ticket-123', 0, SECRET);
    // Simulates a reissue: the row's credentialVersion is now 1, so the
    // old token (still version 0) must no longer verify.
    expect(verifyCredential(oldToken, SECRET)?.version).toBe(0);
    const newToken = signCredential('ticket-123', 1, SECRET);
    expect(newToken).not.toBe(oldToken);
    expect(verifyCredential(newToken, SECRET)).toEqual({ id: 'ticket-123', version: 1 });
  });

  it('rejects a credential signed with a different secret', () => {
    const token = signCredential('ticket-123', 0, SECRET);
    expect(verifyCredential(token, OTHER_SECRET)).toBeNull();
  });

  it('rejects a tampered id with the original signature reused', () => {
    const token = signCredential('ticket-123', 0, SECRET);
    const [, version, signature] = token.split('.');
    const tampered = `ticket-999.${version}.${signature}`;
    expect(verifyCredential(tampered, SECRET)).toBeNull();
  });

  it('rejects a tampered version with the original signature reused', () => {
    const token = signCredential('ticket-123', 0, SECRET);
    const [id, , signature] = token.split('.');
    const tampered = `${id}.1.${signature}`;
    expect(verifyCredential(tampered, SECRET)).toBeNull();
  });

  it('rejects malformed input: wrong number of segments', () => {
    expect(verifyCredential('only-two.parts', SECRET)).toBeNull();
    expect(verifyCredential('way.too.many.segments.here', SECRET)).toBeNull();
  });

  it('rejects a non-integer or negative version', () => {
    expect(verifyCredential('id.not-a-number.sig', SECRET)).toBeNull();
    expect(verifyCredential('id.-1.sig', SECRET)).toBeNull();
  });

  it('rejects empty or absurdly long input without throwing', () => {
    expect(verifyCredential('', SECRET)).toBeNull();
    expect(verifyCredential('x'.repeat(1000), SECRET)).toBeNull();
  });
});
