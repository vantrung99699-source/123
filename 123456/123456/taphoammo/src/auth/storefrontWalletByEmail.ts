/**
 * Số dư ví storefront theo email (localStorage).
 * Demo: mặc định / nạp lại 100.000.000đ khi số dư < 1.000.000đ để thử mua hàng kỹ.
 */
import { getStorefrontSignupByEmail } from './storefrontDemoAccounts';

/** Khóa localStorage — đồng bộ storefront header «Số dư» & Admin Quản lý người dùng (docs/quanlynguoidung.md). */
export const STOREFRONT_WALLET_BY_EMAIL_KEY = 'taphoammo_storefront_wallet_by_email';

const KEY = STOREFRONT_WALLET_BY_EMAIL_KEY;

/** Số dư ban đầu & nạp lại khi ví demo còn quá ít. */
export const STOREFRONT_DEMO_WALLET_VND = 100_000_000;

/** Dưới ngưỡng này → tự nạp lại `STOREFRONT_DEMO_WALLET_VND` (lần đọc tiếp theo). */
const DEMO_WALLET_TOP_UP_THRESHOLD_VND = 1_000_000;

const LEGACY_DEFAULT_VND = STOREFRONT_DEMO_WALLET_VND;

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, number>;
    return typeof o === 'object' && o !== null ? o : {};
  } catch {
    return {};
  }
}

/** Số dư hiển thị / dùng cho email — demo nạp lại khi < 1tr để thử mua nhiều đơn. */
export function getStorefrontWalletVndForEmail(email: string): number {
  const k = normEmail(email);
  if (!k) return LEGACY_DEFAULT_VND;
  const map = readMap();
  if (typeof map[k] === 'number' && !Number.isNaN(map[k])) {
    const v = Math.max(0, Math.floor(map[k]));
    if (v < DEMO_WALLET_TOP_UP_THRESHOLD_VND) {
      setStorefrontWalletVndForEmail(email, STOREFRONT_DEMO_WALLET_VND);
      return STOREFRONT_DEMO_WALLET_VND;
    }
    return v;
  }
  if (getStorefrontSignupByEmail(k)) {
    return STOREFRONT_DEMO_WALLET_VND;
  }
  return LEGACY_DEFAULT_VND;
}

export function setStorefrontWalletVndForEmail(email: string, vnd: number): void {
  const k = normEmail(email);
  if (!k) return;
  const map = readMap();
  map[k] = Math.max(0, Math.floor(vnd));
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/**
 * Số dư hiển thị trong Admin Quản lý người dùng:
 * - Đã có trong map (đã chỉnh / mua hàng) → dùng map.
 * - Email đăng ký storefront, chưa map → 0.
 * - Người mock (không trong đăng ký) → `mockFallbackBalanceVnd` (số dư từ `ADMIN_USERS`).
 */
export function getAdminUserBalanceVnd(email: string, mockFallbackBalanceVnd: number): number {
  const k = normEmail(email);
  if (!k) return Math.max(0, Math.floor(mockFallbackBalanceVnd));
  const map = readMap();
  if (typeof map[k] === 'number' && !Number.isNaN(map[k])) {
    return Math.max(0, Math.floor(map[k]));
  }
  if (getStorefrontSignupByEmail(k)) {
    return STOREFRONT_DEMO_WALLET_VND;
  }
  return Math.max(0, Math.floor(mockFallbackBalanceVnd));
}
