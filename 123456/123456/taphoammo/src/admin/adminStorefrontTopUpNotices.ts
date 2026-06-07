/**
 * Thông báo inline trên trang Nạp tiền (không phải popup).
 */
export type StorefrontTopUpNoticeVariant = 'info' | 'warning' | 'success';

export interface StorefrontTopUpNotice {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  variant: StorefrontTopUpNoticeVariant;
  createdAtMs: number;
  updatedAtMs: number;
}

const STORAGE_KEY = 'taphoammo_admin_storefront_topup_notices_v1';

function newId(): string {
  return `topup-notice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeItem(raw: unknown): StorefrontTopUpNotice | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<StorefrontTopUpNotice>;
  if (typeof r.id !== 'string' || !r.id.trim()) return null;
  if (typeof r.title !== 'string') return null;
  if (typeof r.content !== 'string') return null;

  return {
    id: r.id.trim(),
    title: r.title.trim(),
    content: r.content,
    enabled: r.enabled !== false,
    variant:
      r.variant === 'warning' || r.variant === 'success' ? r.variant : 'info',
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

export function listStorefrontTopUpNotices(): StorefrontTopUpNotice[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeItem)
      .filter((x): x is StorefrontTopUpNotice => x != null)
      .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  } catch {
    return [];
  }
}

export function listActiveStorefrontTopUpNotices(): StorefrontTopUpNotice[] {
  return listStorefrontTopUpNotices().filter(n => n.enabled);
}

function writeAll(list: StorefrontTopUpNotice[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function createStorefrontTopUpNotice(
  partial: Pick<StorefrontTopUpNotice, 'title' | 'content'> &
    Partial<Pick<StorefrontTopUpNotice, 'enabled' | 'variant'>>
): StorefrontTopUpNotice {
  const now = Date.now();
  const item: StorefrontTopUpNotice = {
    id: newId(),
    title: partial.title.trim(),
    content: partial.content,
    enabled: partial.enabled !== false,
    variant: partial.variant ?? 'info',
    createdAtMs: now,
    updatedAtMs: now,
  };
  writeAll([item, ...listStorefrontTopUpNotices()]);
  return item;
}

export function updateStorefrontTopUpNotice(
  id: string,
  patch: Partial<Pick<StorefrontTopUpNotice, 'title' | 'content' | 'enabled' | 'variant'>>
): StorefrontTopUpNotice | null {
  const list = listStorefrontTopUpNotices();
  const idx = list.findIndex(n => n.id === id);
  if (idx < 0) return null;
  const next: StorefrontTopUpNotice = {
    ...list[idx],
    ...patch,
    title: patch.title !== undefined ? patch.title.trim() : list[idx].title,
    updatedAtMs: Date.now(),
  };
  const updated = [...list];
  updated[idx] = next;
  writeAll(updated);
  return next;
}

export function deleteStorefrontTopUpNotice(id: string): boolean {
  const list = listStorefrontTopUpNotices();
  const next = list.filter(n => n.id !== id);
  if (next.length === list.length) return false;
  writeAll(next);
  return true;
}

export function toggleStorefrontTopUpNotice(id: string, enabled: boolean): boolean {
  return updateStorefrontTopUpNotice(id, { enabled }) != null;
}

export function topUpNoticeVariantLabel(variant: StorefrontTopUpNoticeVariant): string {
  switch (variant) {
    case 'warning':
      return 'Cảnh báo';
    case 'success':
      return 'Thành công';
    default:
      return 'Thông tin';
  }
}
