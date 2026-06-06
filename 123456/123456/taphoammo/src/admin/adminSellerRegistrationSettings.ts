/**
 * Cài đặt đăng ký bán hàng — duyệt tự động (demo localStorage).
 */

export interface AdminSellerRegistrationSettings {
  /** Bật: đơn mới được duyệt ngay khi người dùng gửi form. */
  autoApproveEnabled: boolean;
}

const STORAGE_KEY = 'taphoammo_admin_seller_registration_settings_v1';

export function defaultAdminSellerRegistrationSettings(): AdminSellerRegistrationSettings {
  return {
    autoApproveEnabled: false,
  };
}

function normalize(raw: unknown): AdminSellerRegistrationSettings {
  const d = defaultAdminSellerRegistrationSettings();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<AdminSellerRegistrationSettings>;
  return {
    autoApproveEnabled: r.autoApproveEnabled === true,
  };
}

export function readAdminSellerRegistrationSettings(): AdminSellerRegistrationSettings {
  if (typeof window === 'undefined') return defaultAdminSellerRegistrationSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAdminSellerRegistrationSettings();
    return normalize(JSON.parse(raw));
  } catch {
    return defaultAdminSellerRegistrationSettings();
  }
}

export function writeAdminSellerRegistrationSettings(
  settings: AdminSellerRegistrationSettings
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(settings)));
  } catch {
    /* ignore */
  }
}
