/**
 * Admin đăng nhập storefront thay người dùng (demo — localStorage).
 */
import type { AdminUser } from '../admin/types';
import {
  capStorefrontUsername,
  getStorefrontHoVaTenForEmail,
} from './storefrontHoVaTenByEmail';
import {
  setSessionLoginUsername,
  setSessionDisplayName,
  setSessionBuyerEmail,
  setStorefrontLoggedIn,
  setStorefrontAccountMode,
} from './roles';

export const ADMIN_IMPERSONATE_FLAG_KEY = 'taphoammo_admin_impersonate_v1';
const IMPERSONATE_EMAIL_KEY = 'taphoammo_admin_impersonate_email';

export function isAdminImpersonatingStorefront(): boolean {
  try {
    return localStorage.getItem(ADMIN_IMPERSONATE_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

export function getAdminImpersonateTargetEmail(): string {
  try {
    return localStorage.getItem(IMPERSONATE_EMAIL_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function clearAdminImpersonateFlag(): void {
  try {
    localStorage.removeItem(ADMIN_IMPERSONATE_FLAG_KEY);
    localStorage.removeItem(IMPERSONATE_EMAIL_KEY);
  } catch {
    /* ignore */
  }
}

export type AdminLoginAsUserResult =
  | { ok: true }
  | { ok: false; message: string };

/** Ghi session storefront và chuyển về trang chủ `/`. */
export function adminLoginAsStorefrontUser(user: AdminUser): AdminLoginAsUserResult {
  if (user.status === 'Bị cấm') {
    return { ok: false, message: 'Tài khoản đang bị cấm — không thể đăng nhập thay người dùng này.' };
  }

  const email = user.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { ok: false, message: 'Email người dùng không hợp lệ.' };
  }

  const username = user.username.trim() || email.split('@')[0] || 'user';
  const hoVaTen = getStorefrontHoVaTenForEmail(email);
  const displayName = hoVaTen || user.name.trim() || capStorefrontUsername(username);

  setSessionLoginUsername(username);
  setSessionDisplayName(displayName);
  setSessionBuyerEmail(email);
  setStorefrontLoggedIn(true);
  setStorefrontAccountMode('buyer');

  try {
    localStorage.setItem(ADMIN_IMPERSONATE_FLAG_KEY, '1');
    localStorage.setItem(IMPERSONATE_EMAIL_KEY, email);
  } catch {
    /* ignore */
  }

  window.location.href = '/';
  return { ok: true };
}
