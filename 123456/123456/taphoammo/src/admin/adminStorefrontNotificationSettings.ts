/**
 * Cài đặt thông báo hiển thị trên storefront (marquee, popup toàn trang, toast).
 */
export interface AdminStorefrontNotificationSettings {
  /** Thanh chữ chạy dưới header */
  marqueeEnabled: boolean;
  marqueeText: string;
  /** Popup toàn trang khi vào storefront */
  popupEnabled: boolean;
  popupTitle: string;
  popupContent: string;
  popupButtonLabel: string;
  /** Chỉ hiện 1 lần mỗi phiên trình duyệt */
  popupOncePerSession: boolean;
  /** Toast góc phải (demo) */
  toastEnabled: boolean;
  toastText: string;
  updatedAtMs: number;
}

const STORAGE_KEY = 'taphoammo_admin_storefront_notifications_v1';

export const DEFAULT_MARQUEE_TEXT =
  'Thông báo quan trọng — Đối với gian hàng không trùng, chúng tôi cam kết sản phẩm được bán ra 1 lần duy nhất trên hệ thống. Bảo hành 1 đổi 1 trong vòng 24h.';

export function defaultStorefrontNotificationSettings(): AdminStorefrontNotificationSettings {
  return {
    marqueeEnabled: true,
    marqueeText: DEFAULT_MARQUEE_TEXT,
    popupEnabled: false,
    popupTitle: 'Thông báo từ TapHoaMMO',
    popupContent:
      'Chào mừng bạn đến với TapHoaMMO. Vui lòng đọc kỹ chính sách bảo hành và quy định giao dịch trước khi mua hàng.',
    popupButtonLabel: 'Đã hiểu',
    popupOncePerSession: true,
    toastEnabled: false,
    toastText: 'Có tin mới từ hệ thống — xem chi tiết tại trang chủ.',
    updatedAtMs: Date.now(),
  };
}

function normalize(raw: unknown): AdminStorefrontNotificationSettings {
  const d = defaultStorefrontNotificationSettings();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<AdminStorefrontNotificationSettings>;
  return {
    marqueeEnabled: r.marqueeEnabled !== false,
    marqueeText:
      typeof r.marqueeText === 'string' && r.marqueeText.trim()
        ? r.marqueeText.trim()
        : d.marqueeText,
    popupEnabled: r.popupEnabled === true,
    popupTitle:
      typeof r.popupTitle === 'string' && r.popupTitle.trim()
        ? r.popupTitle.trim()
        : d.popupTitle,
    popupContent:
      typeof r.popupContent === 'string' && r.popupContent.trim()
        ? r.popupContent.trim()
        : d.popupContent,
    popupButtonLabel:
      typeof r.popupButtonLabel === 'string' && r.popupButtonLabel.trim()
        ? r.popupButtonLabel.trim()
        : d.popupButtonLabel,
    popupOncePerSession: r.popupOncePerSession !== false,
    toastEnabled: r.toastEnabled === true,
    toastText:
      typeof r.toastText === 'string' && r.toastText.trim()
        ? r.toastText.trim()
        : d.toastText,
    updatedAtMs:
      typeof r.updatedAtMs === 'number' && Number.isFinite(r.updatedAtMs)
        ? r.updatedAtMs
        : d.updatedAtMs,
  };
}

export function readStorefrontNotificationSettings(): AdminStorefrontNotificationSettings {
  if (typeof window === 'undefined') return defaultStorefrontNotificationSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStorefrontNotificationSettings();
    return normalize(JSON.parse(raw));
  } catch {
    return defaultStorefrontNotificationSettings();
  }
}

export function writeStorefrontNotificationSettings(
  settings: AdminStorefrontNotificationSettings
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...settings, updatedAtMs: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

export const POPUP_DISMISSED_SESSION_KEY = 'taphoammo_storefront_popup_dismissed_v1';

export function isStorefrontPopupDismissedThisSession(): boolean {
  try {
    return sessionStorage.getItem(POPUP_DISMISSED_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function markStorefrontPopupDismissedThisSession(): void {
  try {
    sessionStorage.setItem(POPUP_DISMISSED_SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}
