import 'server-only';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'prefId';
const ONE_YEAR = 60 * 60 * 24 * 365; // seconds

// Read-only accessor for server code not allowed to set cookies
export function getPreferenceIdFromCookie(): string | null {
  return cookies().get(COOKIE_NAME)?.value ?? null;
}

// For use only in Route Handlers / Server Actions to ensure the cookie exists
export function ensurePreferenceId(): string {
  const jar = cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  jar.set({
    name: COOKIE_NAME,
    value: id,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: ONE_YEAR,
  });
  return id;
}