/**
 * Thông báo admin — lưu localStorage (bổ sung mock ban đầu).
 */
import { ADMIN_NOTIFICATIONS } from './data';
import type { AdminNotification } from './types';

const STORAGE_KEY = 'taphoammo_admin_notifications_v1';

function isNotification(raw: unknown): raw is AdminNotification {
  if (!raw || typeof raw !== 'object') return false;
  const n = raw as AdminNotification;
  return (
    typeof n.id === 'string' &&
    typeof n.title === 'string' &&
    typeof n.content === 'string' &&
    (n.type === 'info' || n.type === 'warning' || n.type === 'success' || n.type === 'error') &&
    typeof n.time === 'string' &&
    typeof n.read === 'boolean'
  );
}

export function readAdminNotifications(): AdminNotification[] {
  if (typeof window === 'undefined') return [...ADMIN_NOTIFICATIONS];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...ADMIN_NOTIFICATIONS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...ADMIN_NOTIFICATIONS];
    return parsed.filter(isNotification);
  } catch {
    return [...ADMIN_NOTIFICATIONS];
  }
}

export function writeAdminNotifications(list: AdminNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function pushAdminNotification(
  notification: Omit<AdminNotification, 'id' | 'read'> & { id?: string; read?: boolean }
): AdminNotification[] {
  const row: AdminNotification = {
    id: notification.id ?? `n-${Date.now()}`,
    title: notification.title,
    content: notification.content,
    type: notification.type,
    time:
      notification.time ||
      new Date().toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    read: notification.read ?? false,
  };
  const next = [row, ...readAdminNotifications()];
  writeAdminNotifications(next);
  return next;
}
