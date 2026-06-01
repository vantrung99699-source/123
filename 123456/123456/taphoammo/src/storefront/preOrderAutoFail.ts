import { orderNewestSortKey, parsePurchaseDateToMs, type Order } from '../ordersTypes';
import { isPreOrderAwaitingFulfillment } from '../orderStatusBadge';
import {
  clampDeliveryDeadlineDays,
  DAY_MS,
  DELIVERY_DEADLINE_DAYS_DEFAULT,
} from './deliveryDeadlineDays';
import { getOrderEffectiveNowMs } from './orderTimeSimulation';

export function getPreOrderDeliveryDeadlineDays(order: Order): number {
  return clampDeliveryDeadlineDays(order.deliveryDeadlineDays ?? DELIVERY_DEADLINE_DAYS_DEFAULT);
}

export function getPreOrderDeadlineMs(order: Order): number | null {
  if (!order.isPreOrder) return null;
  const days = getPreOrderDeliveryDeadlineDays(order);
  let startMs: number | null = null;
  if (typeof order.createdAtMs === 'number' && !Number.isNaN(order.createdAtMs)) {
    startMs = order.createdAtMs;
  } else {
    startMs = parsePurchaseDateToMs(order.purchaseDate) ?? null;
  }
  if (startMs == null) startMs = orderNewestSortKey(order);
  return startMs + days * DAY_MS;
}

export function shouldAutoFailPreOrderNow(order: Order, realNowMs = Date.now()): boolean {
  if (!isPreOrderAwaitingFulfillment(order)) return false;
  const deadline = getPreOrderDeadlineMs(order);
  if (deadline == null) return false;
  return getOrderEffectiveNowMs(order, realNowMs) >= deadline;
}

export function getPreOrderAutoFailPatch(order: Order, realNowMs = Date.now()): Partial<Order> | null {
  if (!shouldAutoFailPreOrderNow(order, realNowMs)) return null;
  return {
    status: 'Thất bại',
    refund: order.checkoutPaid ? order.totalAmount : '0đ',
    preOrderAutoFailed: true,
    failureKind: 'preorder_delivery_timeout',
  };
}

export function applyPreOrderAutoFailToOrder(order: Order, realNowMs = Date.now()): Order {
  const patch = getPreOrderAutoFailPatch(order, realNowMs);
  return patch ? { ...order, ...patch } : order;
}

export function formatPreOrderDeadlineRemainingLabel(order: Order, realNowMs = Date.now()): string | null {
  if (!isPreOrderAwaitingFulfillment(order)) return null;
  const deadline = getPreOrderDeadlineMs(order);
  if (deadline == null) return null;
  const remaining = deadline - getOrderEffectiveNowMs(order, realNowMs);
  const days = getPreOrderDeliveryDeadlineDays(order);
  if (remaining <= 0) return `Quá ${days} ngày — shop chưa giao, đơn sẽ Thất bại`;
  const daysLeft = Math.ceil(remaining / DAY_MS);
  return `Shop phải giao trong ${days} ngày — còn ~${daysLeft} ngày`;
}
