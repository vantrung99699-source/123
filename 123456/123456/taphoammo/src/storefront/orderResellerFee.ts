import type { Order } from '../ordersTypes';
import { STOREFRONT_VIRTUAL_ACCOUNT } from '../auth/roles';
import {
  getResellerEffectivePercentForBuyer,
  getResellerShopDefaultPercent,
  type ResellerRequest,
} from '../reseller/resellerRequests';
import { getOrderFeeBasisTotalVnd } from '../orderRefund';
import { formatVnd, parsePriceToVndNumber } from '../orderAmountDisplay';

export interface ResellerReferrerContext {
  email: string;
  name: string;
  gianHangId: string;
  /** Mở qua link ?ref=… — cho phép thử một tài khoản (Reseller → copy → Người mua). */
  viaLink?: boolean;
}

export const RESELLER_REF_STORAGE_KEY = 'taphoammo_reseller_ref_v1';
const RESELLER_REF_LOCAL_KEY = 'taphoammo_reseller_ref_local_v1';

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Đơn có người giới thiệu (reseller) — hiển thị hoa hồng trong cột Sàn / Reseller. */
export function hasOrderResellerReferrer(order: Order): boolean {
  const label = order.reseller?.trim();
  if (label && label !== '-' && label !== '0') return true;
  if (typeof order.resellerPercent === 'number' && order.resellerPercent > 0) return true;
  return parsePriceToVndNumber(order.resellerFee || '0') > 0;
}

export function computeResellerCommissionVnd(totalVnd: number, percent: number): number {
  if (totalVnd <= 0 || percent <= 0) return 0;
  const raw = (totalVnd * Math.min(percent, 100)) / 100;
  const rounded = Math.round(raw);
  return rounded > 0 ? rounded : 0;
}

/** Tiền reseller (người giới thiệu) được hưởng trên đơn = tổng đơn × % chiết khấu. */
export function getOrderResellerFeeVnd(order: Order): number {
  if (!hasOrderResellerReferrer(order)) return 0;

  if (
    typeof order.resellerPercent === 'number' &&
    Number.isFinite(order.resellerPercent) &&
    order.resellerPercent > 0
  ) {
    const computed = computeResellerCommissionVnd(
      getOrderFeeBasisTotalVnd(order),
      order.resellerPercent
    );
    if (computed > 0) return computed;
  }

  return parsePriceToVndNumber(order.resellerFee || '0');
}

export function formatOrderResellerFeeDisplay(order: Order): string {
  const vnd = getOrderResellerFeeVnd(order);
  return vnd > 0 ? formatVnd(vnd) : '0đ';
}

/** Mọi định danh có thể gắn trên đơn (tên copy link, username, email, …). */
export function collectResellerReferrerIdentityKeys(
  referrerEmail: string,
  referrerName?: string,
  referrerLoginName?: string,
  extraKeys?: string[]
): string[] {
  const keys = new Set<string>();
  const push = (s?: string) => {
    const t = s?.trim().toLowerCase();
    if (t) keys.add(t);
  };
  push(normEmail(referrerEmail));
  push(referrerName);
  push(referrerLoginName);
  extraKeys?.forEach(push);
  return [...keys];
}

/** Đơn do reseller hiện tại giới thiệu (so khớp email / tên / username trên đơn). */
export function isOrderForResellerReferrer(
  order: Order,
  referrerEmail: string,
  referrerName?: string,
  referrerLoginName?: string,
  extraIdentityKeys?: string[]
): boolean {
  if (!hasOrderResellerReferrer(order)) return false;

  const email = normEmail(referrerEmail);
  if (order.resellerReferrerEmail && normEmail(order.resellerReferrerEmail) === email) {
    return true;
  }

  const identityKeys = collectResellerReferrerIdentityKeys(
    referrerEmail,
    referrerName,
    referrerLoginName,
    extraIdentityKeys
  );

  const tag = order.reseller?.trim().toLowerCase();
  if (!tag) return false;

  if (identityKeys.some(k => tag === k)) return true;

  if (tag.includes('@')) {
    const tagEmail = normEmail(tag);
    if (identityKeys.includes(tagEmail)) return true;
  }

  return false;
}

export function buildResellerFeeFieldsForCheckout(
  totalVnd: number,
  referrer: ResellerReferrerContext | null | undefined,
  resellerPercent: number | null | undefined
): Pick<Order, 'reseller' | 'resellerReferrerEmail' | 'resellerPercent' | 'resellerFee'> {
  if (!referrer || resellerPercent == null || resellerPercent <= 0) {
    return {};
  }
  const feeVnd = computeResellerCommissionVnd(totalVnd, resellerPercent);
  return {
    reseller: referrer.name.trim() || referrer.email,
    resellerReferrerEmail: normEmail(referrer.email),
    resellerPercent,
    resellerFee: feeVnd > 0 ? formatVnd(feeVnd) : '0đ',
  };
}

function normalizeReferrerContext(parsed: ResellerReferrerContext): ResellerReferrerContext | null {
  if (!parsed?.email?.trim() || !parsed?.gianHangId?.trim()) return null;
  return {
    email: normEmail(parsed.email),
    name: (parsed.name || parsed.email).trim(),
    gianHangId: parsed.gianHangId.trim(),
    viaLink: Boolean(parsed.viaLink),
  };
}

export function readResellerReferrerFromStorage(): ResellerReferrerContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      sessionStorage.getItem(RESELLER_REF_STORAGE_KEY) ??
      localStorage.getItem(RESELLER_REF_LOCAL_KEY);
    if (!raw) return null;
    return normalizeReferrerContext(JSON.parse(raw) as ResellerReferrerContext);
  } catch {
    return null;
  }
}

export function writeResellerReferrerToStorage(ctx: ResellerReferrerContext): void {
  if (typeof window === 'undefined') return;
  const payload = JSON.stringify({
    email: normEmail(ctx.email),
    name: ctx.name.trim() || ctx.email,
    gianHangId: ctx.gianHangId.trim(),
    viaLink: Boolean(ctx.viaLink),
  });
  try {
    sessionStorage.setItem(RESELLER_REF_STORAGE_KEY, payload);
    localStorage.setItem(RESELLER_REF_LOCAL_KEY, payload);
  } catch {
    /* ignore */
  }
}

export function parseResellerRefFromSearch(search: string): ResellerReferrerContext | null {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const email = params.get('ref')?.trim();
  const gianHangId = params.get('gian')?.trim();
  if (!email || !gianHangId) return null;
  const name = params.get('refName')?.trim() || email;
  return {
    email: normEmail(email),
    name,
    gianHangId,
    viaLink: true,
  };
}

/** % chiết khấu áp dụng cho người giới thiệu trên gian này. */
export function resolveResellerPercentForReferrer(
  requests: ResellerRequest[],
  referrer: ResellerReferrerContext,
  gianConfiguredPercent: number
): number {
  const shopDefault = getResellerShopDefaultPercent(
    requests,
    referrer.gianHangId,
    gianConfiguredPercent
  );
  return getResellerEffectivePercentForBuyer(
    requests,
    referrer.email,
    referrer.gianHangId,
    shopDefault
  );
}

/** Referrer hợp lệ cho gian — chặn tự giới thiệu trừ khi mở đúng link ref (demo / A→B). */
export function activeResellerReferrerForGian(
  referrer: ResellerReferrerContext | null | undefined,
  gianHangId: string | undefined,
  buyerEmail: string
): ResellerReferrerContext | null {
  if (!referrer || !gianHangId || referrer.gianHangId !== gianHangId) return null;
  if (normEmail(referrer.email) === normEmail(buyerEmail) && !referrer.viaLink) return null;
  return referrer;
}

/** Ref demo khi chế độ Người mua — coi như đã mở link COPY (viaLink). */
export function buildDemoResellerReferrerForGian(gianHangId: string): ResellerReferrerContext {
  return {
    email: normEmail(STOREFRONT_VIRTUAL_ACCOUNT.email),
    name: STOREFRONT_VIRTUAL_ACCOUNT.username,
    gianHangId: gianHangId.trim(),
    viaLink: true,
  };
}

/**
 * Người mua: ưu tiên ref từ URL/storage; không có thì dùng ref demo (một tài khoản thử Reseller).
 */
export function resolveResellerReferrerForBuyerCheckout(params: {
  storedReferrer: ResellerReferrerContext | null | undefined;
  gianHangId: string | undefined;
  buyerEmail: string;
  isBuyerAccountMode: boolean;
}): ResellerReferrerContext | null {
  if (!params.isBuyerAccountMode || !params.gianHangId?.trim()) return null;
  const gianHangId = params.gianHangId.trim();
  const fromStorage = activeResellerReferrerForGian(
    params.storedReferrer,
    gianHangId,
    params.buyerEmail
  );
  if (fromStorage) return fromStorage;
  return activeResellerReferrerForGian(
    buildDemoResellerReferrerForGian(gianHangId),
    gianHangId,
    params.buyerEmail
  );
}

/** Gắn hoa hồng Reseller khi người mua (buyer) thanh toán qua link giới thiệu. */
export function buildResellerFeeFieldsForBuyerCheckout(params: {
  totalVnd: number;
  buyerEmail: string;
  gianHangId: string | undefined;
  gianResellerPercent: number | null | undefined;
  referrer: ResellerReferrerContext | null | undefined;
  isBuyerAccountMode: boolean;
  requests: ResellerRequest[];
}): Pick<Order, 'reseller' | 'resellerReferrerEmail' | 'resellerPercent' | 'resellerFee'> {
  if (!params.isBuyerAccountMode) return {};
  if (!params.gianHangId || params.gianResellerPercent == null || params.gianResellerPercent <= 0) {
    return {};
  }
  const ref = resolveResellerReferrerForBuyerCheckout({
    storedReferrer: params.referrer,
    gianHangId: params.gianHangId,
    buyerEmail: params.buyerEmail,
    isBuyerAccountMode: true,
  });
  if (!ref) return {};
  const pct = resolveResellerPercentForReferrer(
    params.requests,
    ref,
    params.gianResellerPercent
  );
  return buildResellerFeeFieldsForCheckout(params.totalVnd, ref, pct);
}
