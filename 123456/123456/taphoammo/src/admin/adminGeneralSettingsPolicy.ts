/**
 * Áp dụng giới hạn từ cài đặt chung — gian hàng, mặt hàng, khiếu nại.
 */
import type { Category } from '../gianHang/types';
import { flattenGianHangLeaves } from '../gianHang/categorySectionUtils';
import type { Order } from '../ordersTypes';
import {
  type AdminGeneralSettings,
  type ComplaintExtraRule,
  type ComplaintLimitExceededAction,
  type ComplaintLimitScope,
  readAdminGeneralSettings,
  complaintScopeLabel,
  complaintExtraRuleKindLabel,
} from './adminGeneralSettings';
import { pushAdminNotification } from './adminNotificationsStorage';

export function resolveGianHangSellerKey(cat: Category): string {
  return (cat.sellerDisplayName || cat.createdByName || '').trim().toLowerCase();
}

export function countGianHangBySeller(categories: Category[], sellerKey: string): number {
  if (!sellerKey) return 0;
  return flattenGianHangLeaves(categories).filter(
    g => resolveGianHangSellerKey(g) === sellerKey
  ).length;
}

export function canSellerCreateGianHang(
  categories: Category[],
  sellerKey: string,
  settings: AdminGeneralSettings = readAdminGeneralSettings()
): { ok: boolean; message?: string } {
  const key = sellerKey.trim().toLowerCase();
  if (!key) return { ok: true };
  const count = countGianHangBySeller(categories, key);
  if (count >= settings.maxGianHangPerSeller) {
    return {
      ok: false,
      message: `Mỗi người bán chỉ được tạo tối đa ${settings.maxGianHangPerSeller} gian hàng (hiện có ${count}). Liên hệ admin để nâng hạn mức.`,
    };
  }
  return { ok: true };
}

export function findGianHangLeafById(
  categories: Category[],
  gianHangId: string
): Category | undefined {
  return flattenGianHangLeaves(categories).find(g => g.id === gianHangId);
}

export function canAddProductToGianHang(
  gianHang: Category,
  settings: AdminGeneralSettings = readAdminGeneralSettings()
): { ok: boolean; message?: string } {
  const count = gianHang.products?.length ?? 0;
  if (count >= settings.maxProductsPerGianHang) {
    return {
      ok: false,
      message: `Gian «${gianHang.name}» chỉ được tối đa ${settings.maxProductsPerGianHang} mặt hàng (hiện có ${count}).`,
    };
  }
  return { ok: true };
}

function isComplaintOrder(order: Order): boolean {
  return (
    order.status === 'Khiếu nại' ||
    order.status === 'Tranh chấp' ||
    Boolean(order.hasComplained)
  );
}

function orderTimestampMs(order: Order): number {
  if (typeof order.createdAtMs === 'number' && order.createdAtMs > 0) return order.createdAtMs;
  const parsed = Date.parse(order.purchaseDate);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function orderMatchesComplaintScope(
  base: Order,
  candidate: Order,
  categories: Category[],
  scope: ComplaintLimitScope
): boolean {
  if (scope === 'mat_hang') {
    const productId = base.adminMatHangId?.trim();
    const productName = base.productName?.trim();
    if (productId && candidate.adminMatHangId === productId) return true;
    if (productId && productName && candidate.productName?.trim() === productName) return true;
    return false;
  }

  const gianId = base.adminGianHangId?.trim();
  const gian = gianId ? findGianHangLeafById(categories, gianId) : undefined;
  const gianName = gian?.name?.trim() || base.storeName?.trim();

  if (gianId && candidate.adminGianHangId === gianId) return true;
  if (gianName && candidate.storeName?.trim() === gianName) return true;
  if (gianName && candidate.sellerName && gian?.sellerDisplayName === candidate.sellerName) {
    return Boolean(candidate.productName && gianName === candidate.storeName);
  }
  return false;
}

function ordersInComplaintScope(
  order: Order,
  orders: Order[],
  categories: Category[],
  scope: ComplaintLimitScope
): Order[] {
  return orders.filter(o => orderMatchesComplaintScope(order, o, categories, scope));
}

export function countComplaintsForOrderScope(
  order: Order,
  orders: Order[],
  categories: Category[],
  settings: AdminGeneralSettings,
  scope: ComplaintLimitScope = settings.complaintScope
): number {
  return ordersInComplaintScope(order, orders, categories, scope).filter(isComplaintOrder).length;
}

function actionFlags(action: ComplaintLimitExceededAction): {
  notifyAdmin: boolean;
  suspend: boolean;
} {
  return {
    notifyAdmin: action === 'notify_admin' || action === 'notify_and_suspend',
    suspend: action === 'suspend_gian' || action === 'notify_and_suspend',
  };
}

function buildLimitExceededEvaluation(
  order: Order,
  message: string,
  action: ComplaintLimitExceededAction
): ComplaintLimitEvaluation {
  const { notifyAdmin, suspend } = actionFlags(action);
  const gianId = order.adminGianHangId?.trim();
  return {
    allowed: false,
    message,
    notifyAdmin,
    suspendGianHangId: suspend ? gianId || undefined : undefined,
  };
}

function evaluateComplaintExtraRule(
  rule: ComplaintExtraRule,
  order: Order,
  orders: Order[],
  categories: Category[],
  settings: AdminGeneralSettings
): ComplaintLimitEvaluation | null {
  if (!rule.enabled || rule.kind === 'notify_each_complaint') return null;

  const scope = rule.scope ?? settings.complaintScope;
  const max = rule.maxCount ?? 1;
  const scoped = ordersInComplaintScope(order, orders, categories, scope);
  const action = rule.onExceeded ?? settings.onComplaintLimitExceeded;
  const scopeLabel = complaintScopeLabel(scope);

  if (rule.kind === 'max_in_days') {
    const days = rule.windowDays ?? 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const inWindow = scoped.filter(
      o => isComplaintOrder(o) && orderTimestampMs(o) >= cutoff
    ).length;
    const after = inWindow + 1;
    if (after > max) {
      return buildLimitExceededEvaluation(
        order,
        `Điều kiện «${complaintExtraRuleKindLabel(rule.kind)}»: tối đa ${max} khiếu nại/tranh chấp trong ${days} ngày (${scopeLabel}). Không thể gửi thêm cho đơn ${order.id}.`,
        action
      );
    }
    return null;
  }

  if (rule.kind === 'max_dispute_status') {
    const open = scoped.filter(o => o.status === 'Tranh chấp').length;
    if (open + 1 > max) {
      return buildLimitExceededEvaluation(
        order,
        `Điều kiện «${complaintExtraRuleKindLabel(rule.kind)}»: tối đa ${max} đơn đang Tranh chấp (${scopeLabel}). Không thể gửi thêm cho đơn ${order.id}.`,
        action
      );
    }
    return null;
  }

  if (rule.kind === 'max_complaint_status') {
    const open = scoped.filter(o => o.status === 'Khiếu nại').length;
    if (open + 1 > max) {
      return buildLimitExceededEvaluation(
        order,
        `Điều kiện «${complaintExtraRuleKindLabel(rule.kind)}»: tối đa ${max} đơn đang Khiếu nại (${scopeLabel}). Không thể gửi thêm cho đơn ${order.id}.`,
        action
      );
    }
  }

  return null;
}

export interface ComplaintLimitEvaluation {
  allowed: boolean;
  message?: string;
  notifyAdmin: boolean;
  suspendGianHangId?: string;
}

export function evaluateNewComplaint(
  order: Order,
  orders: Order[],
  categories: Category[],
  settings: AdminGeneralSettings = readAdminGeneralSettings()
): ComplaintLimitEvaluation {
  const current = countComplaintsForOrderScope(order, orders, categories, settings);
  const after = current + 1;
  const max = settings.maxComplaintsPerScope;

  if (after > max) {
    const scope = complaintScopeLabel(settings.complaintScope);
    return buildLimitExceededEvaluation(
      order,
      `Đã vượt giới hạn ${max} khiếu nại/tranh chấp (${scope}). Không thể gửi thêm khiếu nại cho đơn ${order.id}.`,
      settings.onComplaintLimitExceeded
    );
  }

  for (const rule of settings.complaintExtraRules ?? []) {
    const blocked = evaluateComplaintExtraRule(rule, order, orders, categories, settings);
    if (blocked) return blocked;
  }

  const notifyEach = (settings.complaintExtraRules ?? []).some(
    r => r.enabled && r.kind === 'notify_each_complaint'
  );

  return { allowed: true, notifyAdmin: notifyEach };
}

export function runComplaintAllowedSideEffects(
  order: Order,
  evaluation: ComplaintLimitEvaluation,
  categories: Category[] = []
): boolean {
  if (!evaluation.allowed || !evaluation.notifyAdmin) return false;
  const gian = order.adminGianHangId
    ? findGianHangLeafById(categories, order.adminGianHangId)
    : undefined;
  pushAdminNotification({
    type: 'warning',
    title: 'Khiếu nại mới',
    content: `Đơn ${order.id} — ${order.productName ?? '—'} / gian ${gian?.name ?? order.storeName ?? '—'}: khách vừa gửi khiếu nại.`,
  });
  return true;
}

export function suspendGianHangInCategories(
  categories: Category[],
  gianHangId: string
): Category[] {
  const patchLeaf = (cats: Category[]): Category[] =>
    cats.map(cat => {
      if (!cat.isParent && cat.id === gianHangId) {
        return {
          ...cat,
          status: 'Tạm ngưng' as const,
          products: (cat.products ?? []).map(p => ({
            ...p,
            active: false,
            sellerToggleLocked: true,
          })),
        };
      }
      if (cat.subCategories?.length) {
        return { ...cat, subCategories: patchLeaf(cat.subCategories) };
      }
      return cat;
    });

  return categories.map(parent => {
    if (!parent.isParent) return parent;
    return {
      ...parent,
      subCategories: patchLeaf(parent.subCategories ?? []),
    };
  });
}

export function runComplaintLimitExceededSideEffects(
  order: Order,
  evaluation: ComplaintLimitEvaluation,
  categories: Category[]
): { categories: Category[]; notificationPushed: boolean } {
  let nextCategories = categories;
  let notificationPushed = false;

  if (evaluation.notifyAdmin) {
    const gian = order.adminGianHangId
      ? findGianHangLeafById(categories, order.adminGianHangId)
      : undefined;
    pushAdminNotification({
      type: 'error',
      title: 'Vượt giới hạn khiếu nại',
      content: `Gian ${gian?.name ?? order.storeName ?? '—'} / đơn ${order.id}: vượt hạn mức khiếu nại. ${evaluation.suspendGianHangId ? 'Đã tạm dừng gian hàng.' : ''}`,
    });
    notificationPushed = true;
  }

  if (evaluation.suspendGianHangId) {
    nextCategories = suspendGianHangInCategories(categories, evaluation.suspendGianHangId);
  }

  return { categories: nextCategories, notificationPushed };
}

/** Thống kê nhanh cho màn cài đặt. */
export function summarizeLimitsUsage(categories: Category[], orders: Order[]) {
  const settings = readAdminGeneralSettings();
  const leaves = flattenGianHangLeaves(categories);
  const sellers = new Set(leaves.map(resolveGianHangSellerKey).filter(Boolean));
  let overProductLimit = 0;
  for (const g of leaves) {
    if ((g.products?.length ?? 0) > settings.maxProductsPerGianHang) overProductLimit += 1;
  }
  const complaintOrders = orders.filter(isComplaintOrder).length;
  return {
    settings,
    gianHangCount: leaves.length,
    sellerCount: sellers.size,
    overProductLimit,
    complaintOrders,
  };
}
