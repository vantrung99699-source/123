/**
 * Họ và tên hiển thị ở hồ sơ storefront — chỉ có sau khi người dùng lưu «Chỉnh sửa hồ sơ» (không dùng tên tài khoản).
 */
export const STOREFRONT_HO_VA_TEN_BY_EMAIL_KEY = 'taphoammo_storefront_ho_va_ten_by_email';

const KEY = STOREFRONT_HO_VA_TEN_BY_EMAIL_KEY;

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, string>;
    return typeof o === 'object' && o !== null ? o : {};
  } catch {
    return {};
  }
}

export function getStorefrontHoVaTenForEmail(email: string): string {
  const k = normEmail(email);
  if (!k) return '';
  const map = readMap();
  const v = map[k];
  if (typeof v !== 'string') return '';
  return v.trim();
}

export function setStorefrontHoVaTenForEmail(email: string, hoVaTen: string): void {
  const k = normEmail(email);
  if (!k) return;
  const map = readMap();
  const t = hoVaTen.trim();
  if (t === '') delete map[k];
  else map[k] = t;
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Giống đăng nhập storefront: viết hoa chữ cái đầu username (fallback tiêu đề khi chưa nhập họ và tên). */
export function capStorefrontUsername(username: string): string {
  if (!username.trim()) return 'Người dùng';
  const u = username.trim();
  return u.charAt(0).toUpperCase() + u.slice(1);
}
