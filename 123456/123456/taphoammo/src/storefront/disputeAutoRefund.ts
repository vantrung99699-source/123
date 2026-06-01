import { orderNewestSortKey, parsePurchaseDateToMs, type Order } from '../ordersTypes';
import {
  ORDER_TIMER_THREE_DAYS_MS,
  getOrderEffectiveNowMs,
  formatTimerRemainingDays,
} from './orderTimeSimulation';

export function getDisputeStartedAtMs(order: Order): number {
  if (typeof order.disputeStartedAtMs === 'number' && !Number.isNaN(order.disputeStartedAtMs)) {
    return order.disputeStartedAtMs;
  }
  if (typeof order.createdAtMs === 'number' && !Number.isNaN(order.createdAtMs)) {
    return order.createdAtMs;
  }
  const fromDate = parsePurchaseDateToMs(order.purchaseDate);
  if (fromDate != null) return fromDate;
  return orderNewestSortKey(order);
}

export function isDisputeAutoRefundCandidate(order: Order): boolean {
  if (order.status !== 'Tranh chấp') return false;
  if (order.disputeAutoRefunded) return false;
  return true;
}

export function shouldAutoRefundDisputeNow(order: Order, realNowMs = Date.now()): boolean {
  if (!isDisputeAutoRefundCandidate(order)) return false;
  const startedAt = getDisputeStartedAtMs(order);
  const effectiveNow = getOrderEffectiveNowMs(order, realNowMs);
  return effectiveNow - startedAt >= ORDER_TIMER_THREE_DAYS_MS;
}

/** Người mua không hủy tranh chấp trong 3 ngày → hoàn tiền (đơn Thất bại + refund 100%). */
export function getDisputeAutoRefundPatch(order: Order, realNowMs = Date.now()): Partial<Order> | null {
  if (!shouldAutoRefundDisputeNow(order, realNowMs)) return null;
  return {
    status: 'Thất bại',
    refund: order.totalAmount,
    disputeAutoRefunded: true,
    failureKind: 'dispute_timeout_refund',
  };
}

export function applyDisputeAutoRefundToOrder(order: Order, realNowMs = Date.now()): Order {
  const patch = getDisputeAutoRefundPatch(order, realNowMs);
  return patch ? { ...order, ...patch } : order;
}

export function formatDisputeRefundRemainingLabel(order: Order, realNowMs = Date.now()): string | null {
  if (!isDisputeAutoRefundCandidate(order)) return null;
  return formatTimerRemainingDays(getDisputeStartedAtMs(order), order, realNowMs);
}

/** Ghi nhận thời điểm bắt đầu tranh chấp khi admin chuyển trạng thái. */
export function patchWhenEnteringDispute(order: Order, realNowMs = Date.now()): Partial<Order> {
  return {
    status: 'Tranh chấp',
    disputeStartedAtMs: order.disputeStartedAtMs ?? realNowMs,
  };
}
