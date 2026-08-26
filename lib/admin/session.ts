import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'mjc_admin';
const TTL_MS = 12 * 60 * 60 * 1000;

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be set and at least 32 characters');
  }
  return value;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function issue(email: string): string {
  const payload = `${Buffer.from(email).toString('base64url')}.${Date.now() + TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

/** Constant-time comparison: a timing oracle on the session MAC is a real bug. */
export function verifyToken(token: string): { email: string } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`));
  const actual = Buffer.from(parts[2]);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  if (Number(parts[1]) < Date.now()) return null;

  return { email: Buffer.from(parts[0], 'base64url').toString('utf8') };
}

export async function startSession(email: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, issue(email), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TTL_MS / 1000,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function readSession(): Promise<{ email: string } | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

/** Password check, also constant-time. */
export function passwordMatches(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
