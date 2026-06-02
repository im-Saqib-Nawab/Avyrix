import type { User } from '@/types';

export const ACCESS_TOKEN_KEY = 'avyrix_access_token';
const ACCESS_TOKEN_COOKIE = 'avyrix_access_token';
const USER_ROLE_COOKIE = 'avyrix_role';

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function persistAuthSession(user: User, token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  setCookie(ACCESS_TOKEN_COOKIE, token, 60 * 60 * 24 * 7);
  setCookie(USER_ROLE_COOKIE, user.role, 60 * 60 * 24 * 7);
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem('auth-storage');
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${USER_ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
