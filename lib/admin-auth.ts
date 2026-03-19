// ============================================================
// Admin Auth — simple password + cookie approach
// Set ADMIN_PASSWORD in your env vars.
// Cookie name: wai_admin_token
// ============================================================

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const COOKIE_NAME = 'wai_admin_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || '';
}

// Simple hash so we don't store plaintext in the cookie
function makeToken(password: string): string {
  // We use a basic approach: base64 of password + salt
  const salt = 'wai-admin-2026';
  return Buffer.from(`${salt}:${password}`).toString('base64');
}

export function verifyPassword(password: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;
  return password === expected;
}

export async function setAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  const token = makeToken(getAdminPassword());
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const password = getAdminPassword();
  if (!password) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return token === makeToken(password);
}

export function isAdminAuthenticatedFromRequest(req: NextRequest): boolean {
  const password = getAdminPassword();
  if (!password) return false;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return token === makeToken(password);
}
