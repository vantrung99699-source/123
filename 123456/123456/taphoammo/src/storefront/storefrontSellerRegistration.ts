/**
 * Đăng ký bán hàng storefront (demo — localStorage).
 */
import { readAdminSellerRegistrationSettings } from '../admin/adminSellerRegistrationSettings';
import { notifySellerRegistrationApproved } from './sellerRegistrationApprovalNotify';

export type SellerRegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface SellerRegistrationRequest {
  id: string;
  email: string;
  fullName: string;
  facebookUrl: string;
  phone: string;
  submittedAtIso: string;
  status: SellerRegistrationStatus;
  approvedAtIso?: string;
  rejectedAtIso?: string;
}

const STORAGE_KEY = 'taphoammo_storefront_seller_registration_v1';

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readAll(): SellerRegistrationRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SellerRegistrationRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: SellerRegistrationRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getSellerRegistrationByEmail(email: string): SellerRegistrationRequest | null {
  const key = normEmail(email);
  if (!key) return null;
  return readAll().find(r => normEmail(r.email) === key) ?? null;
}

export function listSellerRegistrations(): SellerRegistrationRequest[] {
  return readAll().sort(
    (a, b) => new Date(b.submittedAtIso).getTime() - new Date(a.submittedAtIso).getTime()
  );
}

export function countPendingSellerRegistrations(): number {
  return readAll().filter(r => r.status === 'pending').length;
}

export function isSellerRegistrationApproved(email: string): boolean {
  const existing = getSellerRegistrationByEmail(email);
  return existing?.status === 'approved';
}

export function hasPendingSellerRegistration(email: string): boolean {
  const existing = getSellerRegistrationByEmail(email);
  return existing?.status === 'pending';
}

function updateRegistration(
  id: string,
  patch: Partial<SellerRegistrationRequest>
): SellerRegistrationRequest | null {
  const list = readAll();
  const idx = list.findIndex(r => r.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch };
  list[idx] = next;
  writeAll(list);
  return next;
}

export function approveSellerRegistration(id: string): SellerRegistrationRequest | null {
  const row = readAll().find(r => r.id === id);
  if (!row || row.status !== 'pending') return null;
  const next = updateRegistration(id, {
    status: 'approved',
    approvedAtIso: new Date().toISOString(),
    rejectedAtIso: undefined,
  });
  if (next) notifySellerRegistrationApproved(next);
  return next;
}

export function rejectSellerRegistration(id: string): SellerRegistrationRequest | null {
  const row = readAll().find(r => r.id === id);
  if (!row || row.status !== 'pending') return null;
  return updateRegistration(id, {
    status: 'rejected',
    rejectedAtIso: new Date().toISOString(),
    approvedAtIso: undefined,
  });
}

/** Hủy duyệt — đưa đơn đã duyệt về chờ duyệt. */
export function revokeSellerRegistrationApproval(id: string): SellerRegistrationRequest | null {
  const row = readAll().find(r => r.id === id);
  if (!row || row.status !== 'approved') return null;
  return updateRegistration(id, {
    status: 'pending',
    approvedAtIso: undefined,
    rejectedAtIso: undefined,
  });
}

export function validateSellerRegistrationForm(input: {
  fullName: string;
  facebookUrl: string;
  phone: string;
}): string | null {
  const fullName = input.fullName.trim();
  if (fullName.length < 2) return 'Vui lòng nhập họ tên (ít nhất 2 ký tự).';

  const facebookUrl = input.facebookUrl.trim();
  if (!facebookUrl) return 'Vui lòng nhập link Facebook liên hệ.';
  const fbOk =
    /^https?:\/\//i.test(facebookUrl) ||
    /^facebook\.com\//i.test(facebookUrl) ||
    /^fb\.com\//i.test(facebookUrl) ||
    /^www\.facebook\.com\//i.test(facebookUrl);
  if (!fbOk) return 'Link Facebook không hợp lệ (ví dụ: https://facebook.com/ten-ban).';

  const phone = input.phone.replace(/\s/g, '');
  if (!/^0\d{9,10}$/.test(phone)) return 'Số điện thoại không hợp lệ (10–11 số, bắt đầu bằng 0).';

  return null;
}

export function submitSellerRegistration(
  email: string,
  input: { fullName: string; facebookUrl: string; phone: string }
): { ok: true; record: SellerRegistrationRequest; autoApproved?: boolean } | { ok: false; error: string } {
  const key = normEmail(email);
  if (!key) return { ok: false, error: 'Vui lòng đăng nhập để đăng ký bán hàng.' };

  const validation = validateSellerRegistrationForm(input);
  if (validation) return { ok: false, error: validation };

  const existing = getSellerRegistrationByEmail(key);
  if (existing?.status === 'pending') {
    return { ok: false, error: 'Bạn đã gửi đăng ký bán hàng. Vui lòng chờ đội ngũ xử lý.' };
  }
  if (existing?.status === 'approved') {
    return { ok: false, error: 'Tài khoản của bạn đã được duyệt đăng ký bán hàng.' };
  }

  const autoApprove = readAdminSellerRegistrationSettings().autoApproveEnabled;
  const nowIso = new Date().toISOString();
  const record: SellerRegistrationRequest = {
    id: `sr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: key,
    fullName: input.fullName.trim(),
    facebookUrl: input.facebookUrl.trim(),
    phone: input.phone.replace(/\s/g, ''),
    submittedAtIso: nowIso,
    status: autoApprove ? 'approved' : 'pending',
    ...(autoApprove ? { approvedAtIso: nowIso } : {}),
  };

  const list = readAll().filter(r => normEmail(r.email) !== key);
  list.unshift(record);
  writeAll(list);

  if (autoApprove) {
    notifySellerRegistrationApproved(record);
  }

  return { ok: true, record, autoApproved: autoApprove };
}
