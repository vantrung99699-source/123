/**
 * Demo phân quyền (localStorage). Production: thay bằng session/JWT từ backend.
 * Console: localStorage.setItem('taphoammo_demo_role', 'user' | 'admin' | 'super_admin')
 * Username: taphoammo_demo_login_username · Họ tên: taphoammo_demo_display_name
 */
export type UserRole = 'user' | 'admin' | 'super_admin';

const ROLE_KEY = 'taphoammo_demo_role';
const LOGIN_USERNAME_KEY = 'taphoammo_demo_login_username';
const DISPLAY_NAME_KEY = 'taphoammo_demo_display_name';
const BUYER_EMAIL_KEY = 'taphoammo_demo_buyer_email';
const STOREFRONT_LOGGED_IN_KEY = 'taphoammo_storefront_logged_in';
/**
 * Chế độ storefront:
 * - seller: người bán
 * - reseller: người giới thiệu (hưởng hoa hồng khi người khác mua qua link)
 * - buyer: người mua (có thể mua qua link reseller → reseller được hưởng)
 */
const STOREFRONT_ACCOUNT_MODE_KEY = 'taphoammo_storefront_account_mode';

export type StorefrontAccountMode = 'seller' | 'buyer' | 'reseller';

/** Người mua — khách mua hàng (kể cả qua link reseller). */
export function isStorefrontBuyerAccountMode(mode: StorefrontAccountMode): boolean {
  return mode === 'buyer';
}

/** Người làm Reseller — giới thiệu, nhận % khi có đơn từ link. */
export function isStorefrontResellerAccountMode(mode: StorefrontAccountMode): boolean {
  return mode === 'reseller';
}

/** Người bán — quản lý gian, doanh thu đơn. */
export function isStorefrontSellerAccountMode(mode: StorefrontAccountMode): boolean {
  return mode === 'seller';
}

/** Giao diện khách (không phải shop): người mua hoặc reseller. */
export function isStorefrontCustomerAccountMode(mode: StorefrontAccountMode): boolean {
  return mode === 'buyer' || mode === 'reseller';
}

const DEFAULT_LOGIN_USERNAME = 'benson_lcdt5e';
const DEFAULT_DISPLAY_NAME = 'Benson Nguyen';
const DEFAULT_BUYER_EMAIL = 'batdongsan361@gmail.com';

/** Tài khoản ảo storefront — đăng nhập một chạm từ «Đăng nhập ngay». */
export const STOREFRONT_VIRTUAL_ACCOUNT = {
  username: DEFAULT_LOGIN_USERNAME,
  email: DEFAULT_BUYER_EMAIL,
  displayName: DEFAULT_DISPLAY_NAME,
} as const;

/** Tài khoản đăng nhập (username), ví dụ benson_lcdt5e */
export function getSessionLoginUsername(): string {
  try {
    const v = localStorage.getItem(LOGIN_USERNAME_KEY);
    if (v != null && v.trim() !== '') return v.trim();
  } catch {
    /* ignore */
  }
  return DEFAULT_LOGIN_USERNAME;
}

export function setSessionLoginUsername(username: string): void {
  try {
    localStorage.setItem(LOGIN_USERNAME_KEY, username.trim());
  } catch {
    /* ignore */
  }
}

/** Họ tên hiển thị (user.name / profile) */
export function getSessionDisplayName(): string {
  try {
    const v = localStorage.getItem(DISPLAY_NAME_KEY);
    if (v != null && v.trim() !== '') return v.trim();
  } catch {
    /* ignore */
  }
  return DEFAULT_DISPLAY_NAME;
}

export function setSessionDisplayName(name: string): void {
  try {
    localStorage.setItem(DISPLAY_NAME_KEY, name.trim());
  } catch {
    /* ignore */
  }
}

export function getSessionBuyerEmail(): string {
  try {
    const v = localStorage.getItem(BUYER_EMAIL_KEY);
    if (v != null && v.trim() !== '') return v.trim();
  } catch {
    /* ignore */
  }
  return DEFAULT_BUYER_EMAIL;
}

export function setSessionBuyerEmail(email: string): void {
  try {
    localStorage.setItem(BUYER_EMAIL_KEY, email.trim());
  } catch {
    /* ignore */
  }
}

export function getStorefrontLoggedIn(): boolean {
  try {
    if (localStorage.getItem(STOREFRONT_LOGGED_IN_KEY) === '0') return false;
    return true;
  } catch {
    return true;
  }
}

export function setStorefrontLoggedIn(loggedIn: boolean): void {
  try {
    localStorage.setItem(STOREFRONT_LOGGED_IN_KEY, loggedIn ? '1' : '0');
  } catch {
    /* ignore */
  }
}

/** Mặc định người mua — demo Reseller tự gắn ref khi thanh toán (không cần mở link COPY). */
export function getStorefrontAccountMode(): StorefrontAccountMode {
  try {
    const v = localStorage.getItem(STOREFRONT_ACCOUNT_MODE_KEY);
    if (v === 'buyer' || v === 'seller' || v === 'reseller') return v;
  } catch {
    /* ignore */
  }
  return 'buyer';
}

export function setStorefrontAccountMode(mode: StorefrontAccountMode): void {
  try {
    localStorage.setItem(STOREFRONT_ACCOUNT_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function getStoredRole(): UserRole {
  try {
    const v = localStorage.getItem(ROLE_KEY);
    if (v === 'user' || v === 'admin' || v === 'super_admin') return v;
  } catch {
    /* ignore */
  }
  return 'super_admin';
}

export function setStoredRole(role: UserRole): void {
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch {
    /* ignore */
  }
}

export function canAccessAdminRoutes(role: UserRole): boolean {
  return role === 'admin' || role === 'super_admin';
}
