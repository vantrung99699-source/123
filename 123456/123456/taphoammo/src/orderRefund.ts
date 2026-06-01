import type { Order } from './ordersTypes';
import { formatVnd, getOrderTotalAmountVnd, parsePriceToVndNumber } from './orderAmountDisplay';

export type RefundOfferStatus = 'pending_buyer' | 'accepted' | 'rejected';

export function computePartialRefundVnd(order: Order, cancelQuantity: number): number {
  const qty = Math.max(1, order.quantity);
  const clamped = Math.min(Math.max(1, Math.floor(cancelQuantity)), qty);
  const total = getOrderTotalAmountVnd(order);
  return Math.round((total * clamped) / qty);
}

export function buildPartialRefundOfferPatch(order: Order, cancelQuantity: number): Partial<Order> {
  const amountVnd = computePartialRefundVnd(order, cancelQuantity);
  return {
    refund: formatVnd(amountVnd),
    partialRefundQuantity: cancelQuantity,
    refundOfferStatus: 'pending_buyer',
  };
}

/** Số tiền thực hoàn vào ví (0 nếu đang chờ khách xác nhận). */
export function getResolvedRefundVnd(order: Order): number {
  if (order.refundOfferStatus === 'pending_buyer') return 0;
  if (!order.refund || order.refund === '0đ') return 0;
  if (order.refund === 'Một phần') {
    if (order.partialRefundQuantity != null) {
      return computePartialRefundVnd(order, order.partialRefundQuantity);
    }
    return 0;
  }
  const parsed = parsePriceToVndNumber(order.refund);
  if (parsed > 0) return parsed;
  if (order.status === 'Thất bại' && order.checkoutPaid) {
    return getOrderTotalAmountVnd(order);
  }
  return 0;
}

export function getOrderRefundDisplay(order: Order): { main: string; sub?: string } {
  const pending = order.refundOfferStatus === 'pending_buyer';
  const rejected = order.refundOfferStatus === 'rejected';

  let vnd = 0;
  if (order.refund === 'Một phần' && order.partialRefundQuantity != null) {
    vnd = computePartialRefundVnd(order, order.partialRefundQuantity);
  } else if (order.refund && order.refund !== 'Một phần') {
    vnd = parsePriceToVndNumber(order.refund);
  }

  if (rejected && vnd === 0) {
    return { main: '0đ', sub: 'Bạn đã từ chối — chờ admin xử lý lại' };
  }

  if (order.partialRefundQuantity != null && order.quantity > 0 && vnd > 0) {
    return {
      main: formatVnd(vnd),
      sub: pending
        ? `Hoàn ${order.partialRefundQuantity}/${order.quantity} — chờ bạn xác nhận`
        : `Hoàn ${order.partialRefundQuantity}/${order.quantity} SP`,
    };
  }

  if (vnd > 0) {
    return {
      main: formatVnd(vnd),
      sub: pending ? 'Chờ bạn xác nhận' : undefined,
    };
  }

  if (order.refund === 'Một phần') {
    return { main: '—', sub: 'Chưa có số tiền (đơn cũ)' };
  }

  return { main: order.refund?.trim() || '0đ' };
}

export function hasPendingRefundOffer(order: Order): boolean {
  return order.refundOfferStatus === 'pending_buyer';
}

/**
 * Tổng tiền làm cơ sở tính phí sàn / Reseller.
 * Hoàn 1 phần: chỉ tính trên phần doanh thu còn lại (tổng − tiền hoàn).
 */
export function getOrderFeeBasisTotalVnd(order: Order): number {
  if (!isPartialRefundOrder(order)) return getOrderTotalAmountVnd(order);
  const total = getOrderTotalAmountVnd(order);
  const refundVnd = getResolvedRefundVnd(order);
  return Math.max(0, total - refundVnd);
}

/** Đơn Thất bại nhưng chỉ hoàn một phần (SL hoặc số tiền < tổng đơn). */
export function isPartialRefundOrder(order: Order): boolean {
  if (order.status !== 'Thất bại') return false;
  if (
    order.failureKind === 'buyer_accepted_partial_refund' ||
    order.refundOfferStatus === 'accepted'
  ) {
    return order.partialRefundQuantity != null && order.partialRefundQuantity < order.quantity;
  }
  if (order.partialRefundQuantity != null && order.partialRefundQuantity < order.quantity) {
    return true;
  }
  const refundVnd = getResolvedRefundVnd(order);
  const totalVnd = getOrderTotalAmountVnd(order);
  return refundVnd > 0 && totalVnd > 0 && refundVnd < totalVnd;
}

/** Dòng phụ dưới badge «Hoàn 1 phần». */
export function getPartialRefundStatusSubtitle(order: Order): string | null {
  if (!isPartialRefundOrder(order)) return null;
  const { main, sub } = getOrderRefundDisplay(order);
  if (sub) return sub;
  if (order.partialRefundQuantity != null && order.quantity > 0) {
    return `Hoàn ${order.partialRefundQuantity}/${order.quantity} SP · ${main}`;
  }
  return main !== '—' ? main : null;
}
