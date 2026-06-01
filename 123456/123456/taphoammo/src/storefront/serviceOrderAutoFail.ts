import type { OrderFailureKind } from '../orderFailureLabel';
import { orderNewestSortKey, parsePurchaseDateToMs, type Order } from '../ordersTypes';
import {
  clampDeliveryDeadlineDays,
  DAY_MS,
  DELIVERY_DEADLINE_DAYS_DEFAULT,
} from './deliveryDeadlineDays';
import { getOrderEffectiveNowMs } from './orderTimeSimulation';

function getServiceDeadlineDays(order: Order): number {
  return clampDeliveryDeadlineDays(order.deliveryDeadlineDays ?? DELIVERY_DEADLINE_DAYS_DEFAULT);
}

function getOrderStartMs(order: Order, preferAccepted: boolean): number {
  if (preferAccepted && typeof order.serviceAcceptedAtMs === 'number' && !Number.isNaN(order.serviceAcceptedAtMs)) {
    return order.serviceAcceptedAtMs;
  }
  if (typeof order.createdAtMs === 'number' && !Number.isNaN(order.createdAtMs)) {
    return order.createdAtMs;
  }
  const fromDate = parsePurchaseDateToMs(order.purchaseDate);
  if (fromDate != null) return fromDate;
  return orderNewestSortKey(order);
}

export function getServiceDeadlineMs(order: Order, phase: 'confirm' | 'deliver'): number {
  const days = getServiceDeadlineDays(order);
  const start =
    phase === 'deliver' && order.status === 'Đang thực hiện'
      ? getOrderStartMs(order, true)
      : getOrderStartMs(order, false);
  return start + days * DAY_MS;
}

export function isServiceAwaitingSellerConfirm(order: Order): boolean {
  return order.order_type === 'service' && order.status === 'Chờ xác nhận' && !order.serviceAutoFailed;
}

export function isServiceAwaitingDelivery(order: Order): boolean {
  return (
    order.order_type === 'service' &&
    order.status === 'Đang thực hiện' &&
    !order.deliveryContent?.trim() &&
    !order.serviceAutoFailed
  );
}

export function shouldAutoFailServiceOrderNow(order: Order, realNowMs = Date.now()): boolean {
  if (order.order_type !== 'service' || order.serviceAutoFailed) return false;
  const effectiveNow = getOrderEffectiveNowMs(order, realNowMs);
  if (isServiceAwaitingSellerConfirm(order)) {
    return effectiveNow >= getServiceDeadlineMs(order, 'confirm');
  }
  if (isServiceAwaitingDelivery(order)) {
    return effectiveNow >= getServiceDeadlineMs(order, 'deliver');
  }
  return false;
}

function serviceAutoFailKind(order: Order): OrderFailureKind {
  return isServiceAwaitingDelivery(order) ? 'service_delivery_timeout' : 'service_confirm_timeout';
}

export function getServiceOrderAutoFailPatch(order: Order, realNowMs = Date.now()): Partial<Order> | null {
  if (!shouldAutoFailServiceOrderNow(order, realNowMs)) return null;
  return {
    status: 'Thất bại',
    refund: order.checkoutPaid ? order.totalAmount : '0đ',
    serviceAutoFailed: true,
    failureKind: serviceAutoFailKind(order),
  };
}

export function applyServiceOrderAutoFailToOrder(order: Order, realNowMs = Date.now()): Order {
  const patch = getServiceOrderAutoFailPatch(order, realNowMs);
  return patch ? { ...order, ...patch } : order;
}

export function formatServiceDeadlineRemainingLabel(order: Order, realNowMs = Date.now()): string | null {
  if (!isServiceAwaitingSellerConfirm(order) && !isServiceAwaitingDelivery(order)) return null;
  const phase = isServiceAwaitingDelivery(order) ? 'deliver' : 'confirm';
  const deadline = getServiceDeadlineMs(order, phase);
  const days = getServiceDeadlineDays(order);
  const remaining = deadline - getOrderEffectiveNowMs(order, realNowMs);
  if (remaining <= 0) {
    return phase === 'confirm'
      ? `Quá ${days} ngày — shop chưa xác nhận, đơn sẽ Thất bại`
      : `Quá ${days} ngày — shop chưa giao dịch vụ, đơn sẽ Thất bại`;
  }
  const daysLeft = Math.ceil(remaining / DAY_MS);
  return phase === 'confirm'
    ? `Shop phải xác nhận trong ${days} ngày — còn ~${daysLeft} ngày`
    : `Shop phải hoàn thành trong ${days} ngày — còn ~${daysLeft} ngày`;
}
