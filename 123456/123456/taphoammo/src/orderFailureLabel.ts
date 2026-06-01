import type { Order } from './ordersTypes';
import {
  clampDeliveryDeadlineDays,
  DELIVERY_DEADLINE_DAYS_DEFAULT,
} from './storefront/deliveryDeadlineDays';
import { getPartialRefundStatusSubtitle, isPartialRefundOrder } from './orderRefund';

/** Nguồn thất bại — dùng nhãn phụ dưới badge «Thất bại». */
export type OrderFailureKind =
  | 'dispute_timeout_refund'
  | 'complaint_timeout_refund'
  | 'preorder_delivery_timeout'
  | 'service_confirm_timeout'
  | 'service_delivery_timeout'
  | 'buyer_cancel'
  | 'seller_cancel'
  | 'admin_cancel'
  | 'admin_resolve_complaint'
  | 'buyer_accepted_partial_refund';

function getDeadlineDays(order: Order): number {
  return clampDeliveryDeadlineDays(order.deliveryDeadlineDays ?? DELIVERY_DEADLINE_DAYS_DEFAULT);
}

function orderHasCheckoutRefund(order: Order): boolean {
  if (order.checkoutPaid) return true;
  const r = order.refund?.trim();
  return !!r && r !== '0đ' && r !== '0';
}

/** Suy ra nguồn thất bại khi chưa có `failureKind` (đơn cũ / mock). */
export function inferOrderFailureKind(order: Order): OrderFailureKind | null {
  if (order.failureKind) return order.failureKind;
  if (order.status !== 'Thất bại') return null;
  if (order.disputeAutoRefunded) return 'dispute_timeout_refund';
  if (order.complaintAutoFailed) return 'complaint_timeout_refund';
  if (order.preOrderAutoFailed) return 'preorder_delivery_timeout';
  if (order.serviceAutoFailed) {
    const accepted = typeof order.serviceAcceptedAtMs === 'number';
    const delivered = !!order.deliveryContent?.trim();
    if (accepted && !delivered) return 'service_delivery_timeout';
    return 'service_confirm_timeout';
  }
  if (order.hasComplained) return 'admin_resolve_complaint';
  return null;
}

export function isDisputeTimeoutFailure(order: Order): boolean {
  return order.status === 'Thất bại' && order.disputeAutoRefunded === true;
}

export function isComplaintTimeoutFailure(order: Order): boolean {
  return order.status === 'Thất bại' && order.complaintAutoFailed === true;
}

/** Thất bại do hết hạn (timer) — nhãn phụ dùng style nổi bật. */
export function isOrderTimerAutoFailure(order: Order): boolean {
  return !!(
    order.disputeAutoRefunded ||
    order.complaintAutoFailed ||
    order.preOrderAutoFailed ||
    order.serviceAutoFailed
  );
}

function labelForKind(order: Order, kind: OrderFailureKind): string {
  const days = getDeadlineDays(order);
  const refund = orderHasCheckoutRefund(order);

  switch (kind) {
    case 'dispute_timeout_refund':
      return 'Hoàn tiền — hết 3 ngày tranh chấp';
    case 'complaint_timeout_refund':
      return 'Hoàn tiền — hết 3 ngày khiếu nại';
    case 'preorder_delivery_timeout':
      return refund
        ? `Hoàn tiền — quá ${days} ngày, shop chưa giao (đặt trước)`
        : `Hủy đơn — quá ${days} ngày, shop chưa giao (đặt trước)`;
    case 'service_confirm_timeout':
      return refund
        ? `Hoàn tiền — quá ${days} ngày, shop chưa xác nhận DV`
        : `Thất bại — quá ${days} ngày, shop chưa xác nhận DV`;
    case 'service_delivery_timeout':
      return refund
        ? `Hoàn tiền — quá ${days} ngày, shop chưa giao DV`
        : `Thất bại — quá ${days} ngày, shop chưa giao DV`;
    case 'buyer_cancel':
      return refund ? 'Hoàn tiền — khách hủy đơn' : 'Hủy đơn — khách hủy';
    case 'seller_cancel':
      return refund ? 'Hoàn tiền — shop hủy đơn' : 'Hủy đơn — shop hủy';
    case 'admin_cancel':
      return refund ? 'Hoàn tiền — admin hủy đơn' : 'Hủy đơn — admin hủy';
    case 'admin_resolve_complaint': {
      if (order.partialRefundQuantity != null) {
        return refund
          ? `Hoàn tiền một phần (${order.partialRefundQuantity} SP) — admin`
          : 'Thất bại — admin xử lý khiếu nại';
      }
      return refund ? 'Hoàn tiền — admin xử lý khiếu nại' : 'Thất bại — admin xử lý khiếu nại';
    }
    case 'buyer_accepted_partial_refund':
      return order.partialRefundQuantity != null
        ? `Hoàn tiền — bạn chấp nhận (${order.partialRefundQuantity}/${order.quantity} SP)`
        : 'Hoàn tiền — bạn chấp nhận hoàn một phần';
    default:
      return refund ? 'Hoàn tiền — hủy đơn' : 'Hủy đơn';
  }
}

/** Nhãn phụ dưới badge — phân biệt hoàn tiền / hủy theo nguồn. */
export function getOrderFailureReasonLabel(order: Order): string | null {
  if (order.status !== 'Thất bại') return null;
  const partialSub = getPartialRefundStatusSubtitle(order);
  if (isPartialRefundOrder(order) && partialSub) return partialSub;
  const kind = inferOrderFailureKind(order);
  if (kind) return labelForKind(order, kind);
  return orderHasCheckoutRefund(order) ? 'Hoàn tiền — hủy đơn' : 'Hủy đơn';
}
