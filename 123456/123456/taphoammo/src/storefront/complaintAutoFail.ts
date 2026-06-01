import { orderNewestSortKey, parsePurchaseDateToMs, type Order } from '../ordersTypes';
import {
  ORDER_TIMER_THREE_DAYS_MS,
  getOrderEffectiveNowMs,
  formatTimerRemainingDays,
} from './orderTimeSimulation';

export function getComplaintStartedAtMs(order: Order): number {
  if (typeof order.complaintStartedAtMs === 'number' && !Number.isNaN(order.complaintStartedAtMs)) {
    return order.complaintStartedAtMs;
  }
  if (typeof order.createdAtMs === 'number' && !Number.isNaN(order.createdAtMs)) {
    return order.createdAtMs;
  }
  const fromDate = parsePurchaseDateToMs(order.purchaseDate);
  if (fromDate != null) return fromDate;
  return orderNewestSortKey(order);
}

export function isComplaintAutoFailCandidate(order: Order): boolean {
  if (order.status !== 'Khiếu nại') return false;
  if (order.complaintAutoFailed) return false;
  return true;
}

export function shouldAutoFailComplaintNow(order: Order, realNowMs = Date.now()): boolean {
  if (!isComplaintAutoFailCandidate(order)) return false;
  const startedAt = getComplaintStartedAtMs(order);
  const effectiveNow = getOrderEffectiveNowMs(order, realNowMs);
  return effectiveNow - startedAt >= ORDER_TIMER_THREE_DAYS_MS;
}

/** Khiếu nại quá 3 ngày (người mua không hủy) → Thất bại + hoàn tiền 100%. */
export function getComplaintAutoFailPatch(order: Order, realNowMs = Date.now()): Partial<Order> | null {
  if (!shouldAutoFailComplaintNow(order, realNowMs)) return null;
  return {
    status: 'Thất bại',
    refund: order.totalAmount,
    complaintAutoFailed: true,
    failureKind: 'complaint_timeout_refund',
  };
}

export function applyComplaintAutoFailToOrder(order: Order, realNowMs = Date.now()): Order {
  const patch = getComplaintAutoFailPatch(order, realNowMs);
  return patch ? { ...order, ...patch } : order;
}

export function formatComplaintFailRemainingLabel(order: Order, realNowMs = Date.now()): string | null {
  if (!isComplaintAutoFailCandidate(order)) return null;
  return formatTimerRemainingDays(getComplaintStartedAtMs(order), order, realNowMs);
}

/** Ghi nhận thời điểm bắt đầu khiếu nại khi người mua gửi. */
export function patchWhenEnteringComplaint(
  order: Order,
  extra: Partial<Order>,
  realNowMs = Date.now()
): Partial<Order> {
  return {
    ...extra,
    status: 'Khiếu nại',
    complaintStartedAtMs: order.complaintStartedAtMs ?? realNowMs,
  };
}

/** Hủy khiếu nại — về trạng thái trước; giữ `hasComplained` (1 lần/đơn), xóa timer K/N. */
export function patchWhenCancellingComplaint(
  order: Order,
  restoredStatus: Order['status']
): Partial<Order> {
  const patch: Partial<Order> = {
    status: restoredStatus,
    previousStatus: undefined,
    hasComplained: true,
    complaintStartedAtMs: undefined,
    complaintAutoFailed: false,
  };
  if (restoredStatus === 'Tạm giữ tiền') {
    patch.escrowHoldStartedAtMs = order.escrowHoldStartedAtMs ?? Date.now();
  }
  return patch;
}
