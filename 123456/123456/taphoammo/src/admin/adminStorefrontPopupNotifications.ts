/**
 * Danh sách thông báo popup storefront (quản lý từ admin).
 */
import { readStorefrontNotificationSettings } from './adminStorefrontNotificationSettings';

export type StorefrontPopupPageTarget = 'home';
export type StorefrontPopupExpirationMode = 'never' | 'duration' | 'datetime';

export interface StorefrontPopupNotification {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  pageTarget: StorefrontPopupPageTarget;
  /** Nhãn hiển thị trên danh sách. */
  scheduleLabel: string;
  expirationMode: StorefrontPopupExpirationMode;
  expirationDurationHours: number;
  expirationAtIso: string;
  autoCloseEnabled: boolean;
  autoCloseHours: number;
  buttonLabel: string;
  oncePerSession: boolean;
  createdAtMs: number;
  updatedAtMs: number;
}

const STORAGE_KEY = 'taphoammo_admin_storefront_popup_notifications_v1';
const DISMISSED_SESSION_KEY = 'taphoammo_storefront_popup_dismissed_ids_v1';

function newId(): string {
  return `popup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function inferExpirationFromLegacyLabel(label: string): Pick<
  StorefrontPopupNotification,
  'expirationMode' | 'expirationDurationHours' | 'expirationAtIso' | 'scheduleLabel'
> {
  const trimmed = label.trim();
  const hourMatch = trimmed.match(/(\d+)\s*giờ/i);
  if (hourMatch) {
    const hours = Math.max(1, Number(hourMatch[1]) || 24);
    return {
      expirationMode: 'duration',
      expirationDurationHours: hours,
      expirationAtIso: '',
      scheduleLabel: `${hours} giờ`,
    };
  }
  const dayMatch = trimmed.match(/(\d+)\s*ngày/i);
  if (dayMatch) {
    const hours = Math.max(1, (Number(dayMatch[1]) || 1) * 24);
    return {
      expirationMode: 'duration',
      expirationDurationHours: hours,
      expirationAtIso: '',
      scheduleLabel: `${hours} giờ`,
    };
  }
  if (trimmed === 'Never' || trimmed === 'Không bao giờ') {
    return {
      expirationMode: 'never',
      expirationDurationHours: 24,
      expirationAtIso: '',
      scheduleLabel: 'Không bao giờ',
    };
  }
  return {
    expirationMode: 'never',
    expirationDurationHours: 24,
    expirationAtIso: '',
    scheduleLabel: trimmed || 'Không bao giờ',
  };
}

export function buildPopupScheduleLabel(item: Pick<
  StorefrontPopupNotification,
  'expirationMode' | 'expirationDurationHours' | 'expirationAtIso'
>): string {
  if (item.expirationMode === 'duration') {
    return `${Math.max(1, item.expirationDurationHours)} giờ`;
  }
  if (item.expirationMode === 'datetime' && item.expirationAtIso) {
    const d = new Date(item.expirationAtIso);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }
  return 'Không bao giờ';
}

function normalizeItem(raw: unknown): StorefrontPopupNotification | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<StorefrontPopupNotification>;
  if (typeof r.id !== 'string' || !r.id.trim()) return null;
  if (typeof r.title !== 'string') return null;
  if (typeof r.content !== 'string') return null;

  const legacyExpiration = inferExpirationFromLegacyLabel(
    typeof r.scheduleLabel === 'string' ? r.scheduleLabel : 'Never'
  );
  const expirationMode: StorefrontPopupExpirationMode =
    r.expirationMode === 'duration' || r.expirationMode === 'datetime'
      ? r.expirationMode
      : legacyExpiration.expirationMode;

  const rawLegacy = raw as { expirationDurationDays?: number };
  const expirationDurationHours =
    typeof r.expirationDurationHours === 'number' && r.expirationDurationHours > 0
      ? r.expirationDurationHours
      : typeof rawLegacy.expirationDurationDays === 'number' && rawLegacy.expirationDurationDays > 0
        ? rawLegacy.expirationDurationDays * 24
        : legacyExpiration.expirationDurationHours;

  const expirationAtIso =
    typeof r.expirationAtIso === 'string' ? r.expirationAtIso : legacyExpiration.expirationAtIso;

  const scheduleLabel = buildPopupScheduleLabel({
    expirationMode,
    expirationDurationHours,
    expirationAtIso,
  });

  const pageTarget: StorefrontPopupPageTarget = 'home';

  return {
    id: r.id.trim(),
    title: r.title.trim() || 'Thông báo',
    content: r.content,
    enabled: r.enabled !== false,
    pageTarget,
    scheduleLabel,
    expirationMode,
    expirationDurationHours,
    expirationAtIso,
    autoCloseEnabled: r.autoCloseEnabled === true,
    autoCloseHours:
      typeof r.autoCloseHours === 'number' && r.autoCloseHours > 0 ? r.autoCloseHours : 24,
    buttonLabel:
      typeof r.buttonLabel === 'string' && r.buttonLabel.trim()
        ? r.buttonLabel.trim()
        : 'Đã hiểu',
    oncePerSession: r.oncePerSession !== false,
    createdAtMs:
      typeof r.createdAtMs === 'number' && Number.isFinite(r.createdAtMs)
        ? r.createdAtMs
        : Date.now(),
    updatedAtMs:
      typeof r.updatedAtMs === 'number' && Number.isFinite(r.updatedAtMs)
        ? r.updatedAtMs
        : Date.now(),
  };
}

function readDismissedIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISSED_SESSION_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function writeDismissedIds(ids: Set<string>): void {
  try {
    sessionStorage.setItem(DISMISSED_SESSION_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

function migrateFromLegacySettings(): StorefrontPopupNotification[] {
  const legacy = readStorefrontNotificationSettings();
  if (!legacy.popupEnabled) return [];
  return [
    {
      id: newId(),
      title: legacy.popupTitle,
      content: legacy.popupContent,
      enabled: true,
      pageTarget: 'home',
      scheduleLabel: 'Không bao giờ',
      expirationMode: 'never',
      expirationDurationHours: 24,
      expirationAtIso: '',
      autoCloseEnabled: false,
      autoCloseHours: 24,
      buttonLabel: legacy.popupButtonLabel,
      oncePerSession: legacy.popupOncePerSession,
      createdAtMs: legacy.updatedAtMs,
      updatedAtMs: legacy.updatedAtMs,
    },
  ];
}

export function listStorefrontPopupNotifications(): StorefrontPopupNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const migrated = migrateFromLegacySettings();
      if (migrated.length) writeStorefrontPopupNotifications(migrated);
      return migrated;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const items = parsed.map(normalizeItem).filter((x): x is StorefrontPopupNotification => x != null);
    return items.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  } catch {
    return [];
  }
}

export function writeStorefrontPopupNotifications(list: StorefrontPopupNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function createStorefrontPopupNotification(
  partial: Pick<StorefrontPopupNotification, 'title' | 'content'> &
    Partial<
      Pick<
        StorefrontPopupNotification,
        | 'enabled'
        | 'pageTarget'
        | 'scheduleLabel'
        | 'expirationMode'
        | 'expirationDurationHours'
        | 'expirationAtIso'
        | 'autoCloseEnabled'
        | 'autoCloseHours'
        | 'buttonLabel'
        | 'oncePerSession'
      >
    >
): StorefrontPopupNotification {
  const now = Date.now();
  const expirationMode = partial.expirationMode ?? 'never';
  const expirationDurationHours = partial.expirationDurationHours ?? 24;
  const expirationAtIso = partial.expirationAtIso ?? '';
  const item: StorefrontPopupNotification = {
    id: newId(),
    title: partial.title.trim() || 'Thông báo mới',
    content: partial.content,
    enabled: partial.enabled !== false,
    pageTarget: 'home',
    expirationMode,
    expirationDurationHours,
    expirationAtIso,
    scheduleLabel:
      partial.scheduleLabel?.trim() ||
      buildPopupScheduleLabel({ expirationMode, expirationDurationHours, expirationAtIso }),
    autoCloseEnabled: partial.autoCloseEnabled === true,
    autoCloseHours:
      typeof partial.autoCloseHours === 'number' && partial.autoCloseHours > 0
        ? partial.autoCloseHours
        : 24,
    buttonLabel: partial.buttonLabel?.trim() || 'Đã hiểu',
    oncePerSession: partial.oncePerSession !== false,
    createdAtMs: now,
    updatedAtMs: now,
  };
  const next = [item, ...listStorefrontPopupNotifications()];
  writeStorefrontPopupNotifications(next);
  return item;
}

export function updateStorefrontPopupNotification(
  id: string,
  patch: Partial<
    Pick<
      StorefrontPopupNotification,
      | 'title'
      | 'content'
      | 'enabled'
      | 'pageTarget'
      | 'scheduleLabel'
      | 'expirationMode'
      | 'expirationDurationHours'
      | 'expirationAtIso'
      | 'autoCloseEnabled'
      | 'autoCloseHours'
      | 'buttonLabel'
      | 'oncePerSession'
    >
  >
): StorefrontPopupNotification | null {
  const list = listStorefrontPopupNotifications();
  const idx = list.findIndex(p => p.id === id);
  if (idx < 0) return null;
  const merged = { ...list[idx], ...patch };
  const next: StorefrontPopupNotification = {
    ...merged,
    title: patch.title !== undefined ? patch.title.trim() || 'Thông báo' : list[idx].title,
    scheduleLabel: buildPopupScheduleLabel(merged),
    updatedAtMs: Date.now(),
  };
  const updated = [...list];
  updated[idx] = next;
  writeStorefrontPopupNotifications(updated);
  return next;
}

export function deleteStorefrontPopupNotification(id: string): boolean {
  const list = listStorefrontPopupNotifications();
  const next = list.filter(p => p.id !== id);
  if (next.length === list.length) return false;
  writeStorefrontPopupNotifications(next);
  return true;
}

export function toggleStorefrontPopupNotification(id: string, enabled: boolean): boolean {
  return updateStorefrontPopupNotification(id, { enabled }) != null;
}

export function pageTargetLabel(_target: StorefrontPopupPageTarget): string {
  return 'Trang chủ';
}

export function stripHtmlPreview(html: string, maxLen = 120): string {
  const text = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return html.trim().slice(0, maxLen);
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

function isPopupExpired(item: StorefrontPopupNotification, now = Date.now()): boolean {
  if (item.expirationMode === 'duration') {
    const expiresAt = item.createdAtMs + item.expirationDurationHours * 3_600_000;
    return now > expiresAt;
  }
  if (item.expirationMode === 'datetime' && item.expirationAtIso) {
    const expiresAt = new Date(item.expirationAtIso).getTime();
    return !Number.isNaN(expiresAt) && now > expiresAt;
  }
  return false;
}

export function resolveActiveStorefrontPopup(params: {
  isHomePage: boolean;
  loggedIn: boolean;
}): StorefrontPopupNotification | null {
  if (!params.loggedIn) return null;
  const dismissed = readDismissedIds();
  const list = listStorefrontPopupNotifications().filter(p => {
    if (!p.enabled) return false;
    if (isPopupExpired(p)) return false;
    if (p.oncePerSession && dismissed.has(p.id)) return false;
    if (!params.isHomePage) return false;
    return true;
  });
  return list[0] ?? null;
}

export function markStorefrontPopupDismissed(popupId: string): void {
  const ids = readDismissedIds();
  ids.add(popupId);
  writeDismissedIds(ids);
}

/** Giữ tương thích code cũ gọi session dismiss toàn cục. */
export function isStorefrontPopupDismissedThisSession(): boolean {
  return readDismissedIds().size > 0;
}

export function markStorefrontPopupDismissedThisSession(): void {
  /* no-op — dùng markStorefrontPopupDismissed theo id */
}
