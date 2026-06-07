const ORDER_NOTIF_KEY = 'taphoammo_storefront_telegram_order_notif_v1';

function norm(email: string): string {
  return email.trim().toLowerCase();
}

function readMap(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ORDER_NOTIF_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ORDER_NOTIF_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Mặc định bật khi chưa có cài đặt. */
export function isStorefrontTelegramOrderNotifEnabled(email: string): boolean {
  const key = norm(email);
  if (!key) return true;
  const map = readMap();
  return map[key] !== false;
}

export function setStorefrontTelegramOrderNotifEnabled(email: string, enabled: boolean): void {
  const key = norm(email);
  if (!key) return;
  const map = readMap();
  map[key] = enabled;
  writeMap(map);
}
