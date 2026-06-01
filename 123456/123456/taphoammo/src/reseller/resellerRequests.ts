import type { Category } from '../gianHang/types';
import { getGianHangResellerPercent } from '../gianHang/categorySectionUtils';

export type ResellerRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ResellerRequest {
  id: string;
  gianHangId: string;
  gianHangName: string;
  productId?: string;
  productName?: string;
  requesterEmail: string;
  requesterName: string;
  /** % sàn so sánh lúc gửi (mặc định gian hoặc % đã duyệt gần nhất). */
  baselinePercent: number;
  requestedPercent: number;
  message: string;
  status: ResellerRequestStatus;
  createdAtMs: number;
  updatedAtMs: number;
  resolvedAtMs?: number;
}

export const RESELLER_REQUESTS_STORAGE_KEY = 'taphoammo_reseller_requests_v1';

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function readResellerRequestsFromStorage(): ResellerRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RESELLER_REQUESTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ResellerRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeResellerRequestsToStorage(requests: ResellerRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RESELLER_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  } catch {
    /* ignore */
  }
}

export function formatResellerRequestDate(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** % đã duyệt gần nhất cho (email, gian); không có thì % mặc định gian. */
export function getResellerApprovedPercent(
  requests: ResellerRequest[],
  requesterEmail: string,
  gianHangId: string,
  gianDefaultPercent: number
): number | null {
  const email = normEmail(requesterEmail);
  const approved = requests
    .filter(
      r =>
        r.gianHangId === gianHangId &&
        normEmail(r.requesterEmail) === email &&
        r.status === 'approved'
    )
    .sort((a, b) => (b.resolvedAtMs ?? b.updatedAtMs) - (a.resolvedAtMs ?? a.updatedAtMs));
  return approved.length > 0 ? approved[0].requestedPercent : null;
}

export function getResellerBaselinePercent(
  requests: ResellerRequest[],
  requesterEmail: string,
  gianHangId: string,
  gianDefaultPercent: number
): number {
  return getResellerApprovedPercent(requests, requesterEmail, gianHangId, gianDefaultPercent) ?? gianDefaultPercent;
}

export function findPendingResellerRequest(
  requests: ResellerRequest[],
  requesterEmail: string,
  gianHangId: string
): ResellerRequest | undefined {
  const email = normEmail(requesterEmail);
  return requests.find(
    r =>
      r.gianHangId === gianHangId &&
      normEmail(r.requesterEmail) === email &&
      r.status === 'pending'
  );
}

/** % tối thiểu phải vượt: đã duyệt / mặc định; nếu đang chờ duyệt thì phải cao hơn cả yêu cầu pending. */
export function getResellerMinimumNextPercent(
  requests: ResellerRequest[],
  requesterEmail: string,
  gianHangId: string,
  gianDefaultPercent: number
): number {
  const baseline = getResellerBaselinePercent(requests, requesterEmail, gianHangId, gianDefaultPercent);
  const pending = findPendingResellerRequest(requests, requesterEmail, gianHangId);
  if (pending) return Math.max(baseline, pending.requestedPercent);
  return baseline;
}

export function parseResellerRequestPercentInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = parseFloat(trimmed.replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, n));
}

export interface SubmitResellerRequestInput {
  gianHangId: string;
  gianHangName: string;
  productId?: string;
  productName?: string;
  requesterEmail: string;
  requesterName: string;
  gianDefaultPercent: number;
  requestedPercent: number;
  message: string;
}

export function submitResellerRequest(
  requests: ResellerRequest[],
  input: SubmitResellerRequestInput
): { ok: true; requests: ResellerRequest[]; updated: boolean } | { ok: false; message: string } {
  const email = normEmail(input.requesterEmail);
  if (!email) {
    return { ok: false, message: 'Vui lòng đăng nhập để gửi yêu cầu Reseller.' };
  }

  const minExclusive = getResellerMinimumNextPercent(
    requests,
    email,
    input.gianHangId,
    input.gianDefaultPercent
  );

  if (input.requestedPercent <= minExclusive) {
    const approved = getResellerApprovedPercent(
      requests,
      email,
      input.gianHangId,
      input.gianDefaultPercent
    );
    if (approved != null) {
      return {
        ok: false,
        message: `Chiết khấu phải lớn hơn ${minExclusive}% (đã duyệt ${approved}%). Bạn có thể yêu cầu tăng dần, ví dụ ${approved}% → ${approved + 5}%.`,
      };
    }
    return {
      ok: false,
      message: `Chiết khấu phải lớn hơn ${minExclusive}% (mặc định gian hàng).`,
    };
  }

  if (input.requestedPercent > 100) {
    return { ok: false, message: 'Chiết khấu tối đa 100%.' };
  }

  const now = Date.now();
  const pending = findPendingResellerRequest(requests, email, input.gianHangId);
  const baseline = getResellerBaselinePercent(
    requests,
    email,
    input.gianHangId,
    input.gianDefaultPercent
  );

  if (pending) {
    const next = requests.map(r =>
      r.id === pending.id
        ? {
            ...r,
            requestedPercent: input.requestedPercent,
            message: input.message.trim(),
            baselinePercent: baseline,
            updatedAtMs: now,
            productId: input.productId ?? r.productId,
            productName: input.productName ?? r.productName,
          }
        : r
    );
    return { ok: true, requests: next, updated: true };
  }

  const row: ResellerRequest = {
    id: `RR-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    gianHangId: input.gianHangId,
    gianHangName: input.gianHangName,
    productId: input.productId,
    productName: input.productName,
    requesterEmail: email,
    requesterName: input.requesterName.trim() || email,
    baselinePercent: baseline,
    requestedPercent: input.requestedPercent,
    message: input.message.trim(),
    status: 'pending',
    createdAtMs: now,
    updatedAtMs: now,
  };

  return { ok: true, requests: [row, ...requests], updated: false };
}

export function resolveResellerRequest(
  requests: ResellerRequest[],
  requestId: string,
  status: 'approved' | 'rejected'
): ResellerRequest[] {
  const now = Date.now();
  return requests.map(r =>
    r.id === requestId && r.status === 'pending'
      ? { ...r, status, resolvedAtMs: now, updatedAtMs: now }
      : r
  );
}

export function countPendingResellerRequests(requests: ResellerRequest[]): number {
  return requests.filter(r => r.status === 'pending').length;
}

export function removeResellerRequest(
  requests: ResellerRequest[],
  requestId: string
): ResellerRequest[] {
  return requests.filter(r => r.id !== requestId);
}

/** % duyệt cao nhất còn lại trên gian (mọi người mua) — dùng khi xóa bản ghi đã duyệt. */
export function getMaxApprovedResellerPercentForGian(
  requests: ResellerRequest[],
  gianHangId: string,
  excludeRequestId?: string
): number | null {
  const approved = requests.filter(
    r =>
      r.gianHangId === gianHangId &&
      r.status === 'approved' &&
      r.id !== excludeRequestId
  );
  if (approved.length === 0) return null;
  return Math.max(...approved.map(r => r.requestedPercent));
}

/** % mặc định gian (không tính % đã duyệt tạm trên cấu hình gian). */
export function inferGianShopDefaultFromRequestHistory(
  requests: ResellerRequest[],
  gianHangId: string,
  configuredFallback: number
): number {
  const baselines = requests
    .filter(r => r.gianHangId === gianHangId)
    .map(r => r.baselinePercent);
  if (baselines.length === 0) return configuredFallback;
  return Math.min(configuredFallback, ...baselines);
}

export function getResellerShopDefaultPercent(
  requests: ResellerRequest[],
  gianHangId: string,
  configuredOnGian: number
): number {
  return inferGianShopDefaultFromRequestHistory(requests, gianHangId, configuredOnGian);
}

/** % buyer đang được hưởng: duyệt gần nhất, không có thì % mặc định gian. */
export function getResellerEffectivePercentForBuyer(
  requests: ResellerRequest[],
  requesterEmail: string,
  gianHangId: string,
  gianShopDefaultPercent: number
): number {
  const approved = getResellerApprovedPercent(
    requests,
    requesterEmail,
    gianHangId,
    gianShopDefaultPercent
  );
  return approved ?? gianShopDefaultPercent;
}

/** % gian sau khi xóa một yêu cầu đã duyệt. */
export function getGianResellerPercentAfterDelete(
  remaining: ResellerRequest[],
  deleted: ResellerRequest,
  configuredFallback: number
): number {
  const maxApproved = getMaxApprovedResellerPercentForGian(remaining, deleted.gianHangId);
  if (maxApproved != null) return maxApproved;
  return inferGianShopDefaultFromRequestHistory(
    remaining,
    deleted.gianHangId,
    Math.min(configuredFallback, deleted.baselinePercent)
  );
}

export function validateResellerRequestedPercent(
  raw: string,
  minExclusive: number
): { ok: true; value: number } | { ok: false; message: string } {
  const value = parseResellerRequestPercentInput(raw);
  if (value == null) {
    return { ok: false, message: 'Nhập % chiết khấu mong muốn (số).' };
  }
  if (value <= minExclusive) {
    return {
      ok: false,
      message: `Chiết khấu phải lớn hơn ${minExclusive}%. Không được nhập ${value}% hoặc thấp hơn.`,
    };
  }
  if (value > 100) {
    return { ok: false, message: 'Chiết khấu tối đa 100%.' };
  }
  return { ok: true, value };
}

export function findGianHangLeafById(categories: Category[], gianHangId: string): Category | null {
  const walk = (nodes: Category[]): Category | null => {
    for (const node of nodes) {
      if (!node.isParent && node.id === gianHangId) return node;
      if (node.subCategories?.length) {
        const found = walk(node.subCategories);
        if (found) return found;
      }
    }
    return null;
  };
  for (const parent of categories) {
    if (parent.subCategories?.length) {
      const found = walk(parent.subCategories);
      if (found) return found;
    }
  }
  return null;
}

export function isResellerRequestForSeller(
  request: ResellerRequest,
  sellerKeys: Set<string>,
  categories: Category[]
): boolean {
  const gian = findGianHangLeafById(categories, request.gianHangId);
  if (!gian) return false;
  const seller =
    (gian.sellerDisplayName || gian.createdByName || '').trim();
  return Boolean(seller && sellerKeys.has(seller));
}

/** Sau duyệt: cập nhật % mặc định reseller trên gian (shop đồng ý mức chiết khấu mới). */
export function applyApprovedResellerPercentToCategories(
  categories: Category[],
  gianHangId: string,
  approvedPercent: number
): Category[] {
  const patchLeaf = (nodes: Category[]): Category[] =>
    nodes.map(node => {
      if (!node.isParent && node.id === gianHangId) {
        return {
          ...node,
          configuration: {
            refundRate: node.configuration?.refundRate ?? 100,
            isSingleProduct: node.configuration?.isSingleProduct ?? false,
            isReseller: true,
            resellerDefaultPercent: approvedPercent,
            isPrivateWarehouse: node.configuration?.isPrivateWarehouse ?? false,
            isLiveUidCheck: node.configuration?.isLiveUidCheck ?? false,
            allowPreOrder: node.configuration?.allowPreOrder,
            saleType: node.configuration?.saleType ?? 'Newest',
          },
        };
      }
      if (node.subCategories?.length) {
        return { ...node, subCategories: patchLeaf(node.subCategories) };
      }
      return node;
    });

  return categories.map(parent =>
    parent.subCategories?.length
      ? { ...parent, subCategories: patchLeaf(parent.subCategories) }
      : parent
  );
}

export function getGianDefaultResellerPercent(categories: Category[], gianHangId: string): number {
  const gian = findGianHangLeafById(categories, gianHangId);
  if (!gian) return 5;
  return getGianHangResellerPercent(gian) ?? 5;
}
