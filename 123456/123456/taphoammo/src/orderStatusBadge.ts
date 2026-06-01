/**
 * Badge trạng thái đơn — một nguồn màu theo skill taphoammo-order-status-badges
 * và taphoammo-purchased-orders-parent (PurchasedOrdersView).
 */
import type { Order, OrderStatus } from './ordersTypes';
import { hasPendingRefundOffer, isPartialRefundOrder } from './orderRefund';

/** Đặt trước chờ seller giao từ kho — chưa có deliveredItems. */
export function isPreOrderAwaitingFulfillment(order: Order): boolean {
  return Boolean(
    order.isPreOrder &&
      !order.preOrderFulfilled &&
      !(order.deliveredItems?.length ?? 0) &&
      order.status !== 'Thất bại' &&
      order.status !== 'Hoàn thành'
  );
}

/** Nhãn badge: chờ giao → «Đặt trước»; hoàn 1 phần → «Hoàn 1 phần»; còn lại → `order.status`. */
export function getOrderStatusDisplayLabel(order: Order): string {
  if (isPreOrderAwaitingFulfillment(order)) return 'Đặt trước';
  if (hasPendingRefundOffer(order)) return 'Chờ xác nhận hoàn';
  if (isPartialRefundOrder(order)) return 'Hoàn 1 phần';
  return order.status;
}

export function getOrderStatusStyleForOrder(order: Order): string {
  if (isPreOrderAwaitingFulfillment(order)) {
    return 'bg-emerald-600 text-white border-transparent';
  }
  if (hasPendingRefundOffer(order)) {
    return 'bg-amber-500 text-amber-950 border-transparent';
  }
  if (isPartialRefundOrder(order)) {
    return 'bg-violet-700 text-white border-transparent';
  }
  return getOrderStatusStyle(order.status);
}

export const ORDER_STATUS_BADGE_BASE =
  'px-2.5 py-1 rounded-xl text-[11px] font-bold border whitespace-nowrap';

export function getOrderStatusStyle(status: OrderStatus): string {
  switch (status) {
    case 'Hoàn thành':
      return 'bg-[#4caf50] text-white border-transparent';
    case 'Đang thực hiện':
      return 'bg-[#42a5f5] text-white border-transparent';
    case 'Khiếu nại':
      return 'bg-[#ef5350] text-white border-transparent';
    case 'Tranh chấp':
      return 'bg-[#ef5350] text-white border-transparent';
    case 'Tạm giữ tiền':
      return 'bg-[#2d6a61] text-white border-transparent';
    case 'Thất bại':
      return 'bg-[#1c2331] text-white border-transparent';
    case 'Chờ xác nhận':
      return 'bg-[#ffb300] text-amber-900 border-transparent';
    default:
      return 'bg-slate-500 text-white border-transparent';
  }
}
