/**
 * Thông báo cá nhân storefront (theo email đăng nhập).
 */

export type StorefrontUserNotificationType = 'info' | 'success' | 'warning' | 'error';

export interface StorefrontUserNotification {
  id: string;
  title: string;
  content: string;
  type: StorefrontUserNotificationType;
  createdAtIso: string;
  read: boolean;
  kind?: 'seller_registration_approved' | 'seller_registration_rejected' | 'gian_hang_approved';
}

const STORAGE_KEY = 'taphoammo_storefront_user_notifications_v1';

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readAll(): Record<string, StorefrontUserNotification[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StorefrontUserNotification[]>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, StorefrontUserNotification[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function listStorefrontUserNotifications(email: string): StorefrontUserNotification[] {
  const key = normEmail(email);
  if (!key) return [];
  return (readAll()[key] ?? []).sort(
    (a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime()
  );
}

export function countUnreadStorefrontUserNotifications(email: string): number {
  return listStorefrontUserNotifications(email).filter(n => !n.read).length;
}

export function pushStorefrontUserNotification(
  email: string,
  input: Omit<StorefrontUserNotification, 'id' | 'createdAtIso' | 'read'> & {
    id?: string;
    createdAtIso?: string;
    read?: boolean;
  }
): StorefrontUserNotification {
  const key = normEmail(email);
  const row: StorefrontUserNotification = {
    id: input.id ?? `un-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    content: input.content,
    type: input.type,
    createdAtIso: input.createdAtIso ?? new Date().toISOString(),
    read: input.read ?? false,
    kind: input.kind,
  };
  if (!key) return row;

  const map = readAll();
  const list = map[key] ?? [];
  map[key] = [row, ...list].slice(0, 80);
  writeAll(map);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('taphoammo-storefront-user-notify', { detail: { email: key } })
    );
  }

  return row;
}

export function markStorefrontUserNotificationRead(email: string, id: string): void {
  const key = normEmail(email);
  if (!key) return;
  const map = readAll();
  const list = map[key] ?? [];
  map[key] = list.map(n => (n.id === id ? { ...n, read: true } : n));
  writeAll(map);
}

export function markAllStorefrontUserNotificationsRead(email: string): void {
  const key = normEmail(email);
  if (!key) return;
  const map = readAll();
  const list = map[key] ?? [];
  map[key] = list.map(n => ({ ...n, read: true }));
  writeAll(map);
}
