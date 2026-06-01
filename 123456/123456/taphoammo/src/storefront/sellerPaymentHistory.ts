import type { Order } from '../ordersTypes';
import { orderNewestSortKey } from '../ordersTypes';
import { getOrderFeeBasisTotalVnd, isPartialRefundOrder } from '../orderRefund';
import { getOrderPlatformFeeVnd } from './orderPlatformFee';
import { getOrderResellerFeeVnd } from './orderResellerFee';
import type { PaymentHistoryItem } from './paymentHistoryTypes';

export type SellerPayoutEscrowStatus = 'holding' | 'completed' | 'partial_refund';

export interface SellerPayoutRow {
  id: string;
  date: string;
  orderId: string;
  buyerName: string;
  productName: string;
  amountVnd: number;
  orderType: 'product' | 'service';
  escrowStatus: SellerPayoutEscrowStatus;
  reason: string;
}

export function isOrderForSeller(order: Order, sellerKeys: Set<string>): boolean {
  const sn = order.sellerName?.trim();
  return Boolean(sn && sellerKeys.has(sn));
}

/** Tiền người bán thực nhận = tổng đơn − phí sàn − hoa hồng Reseller (nếu có). */
export function getSellerPayoutAmountVnd(order: Order): number {
  const basis = getOrderFeeBasisTotalVnd(order);
  const platformFee = getOrderPlatformFeeVnd(order);
  const resellerFee = getOrderResellerFeeVnd(order);
  return Math.max(0, basis - platformFee - resellerFee);
}

export function getSellerPlatformFeeVnd(order: Order): number {
  return getOrderPlatformFeeVnd(order);
}

function buildSellerPayoutReason(order: Order, completed: boolean, partial: boolean): string {
  const platformFee = getOrderPlatformFeeVnd(order);
  const resellerFee = getOrderResellerFeeVnd(order);
  const feeNote =
    resellerFee > 0
      ? ` (đã trừ phí sàn ${platformFee.toLocaleString('vi-VN')}đ, Reseller ${resellerFee.toLocaleString('vi-VN')}đ)`
      : platformFee > 0
        ? ` (đã trừ phí sàn ${platformFee.toLocaleString('vi-VN')}đ)`
        : '';
  if (partial) {
    const qtyNote =
      order.partialRefundQuantity != null && order.quantity > 0
        ? ` — hoàn ${order.partialRefundQuantity}/${order.quantity} SP, giữ phần còn lại`
        : ' — hoàn một phần, giữ phần còn lại';
    return `Doanh thu sau hoàn 1 phần${qtyNote}${feeNote}`;
  }
  return completed
    ? `Doanh thu sau tạm giữ — đơn đã hoàn thành${feeNote}`
    : `Tiền tạm giữ trên sàn — chờ hết thời gian giữ${feeNote}`;
}

export function buildSellerPayoutRows(orders: Order[], sellerKeys: Set<string>): SellerPayoutRow[] {
  return orders
    .filter(o => {
      if (!isOrderForSeller(o, sellerKeys) || o.checkoutPaid !== true) return false;
      if (o.status === 'Hoàn thành' || o.status === 'Tạm giữ tiền') return true;
      return isPartialRefundOrder(o) && o.refundOfferStatus === 'accepted';
    })
    .map(o => {
      const partial = isPartialRefundOrder(o) && o.refundOfferStatus === 'accepted';
      const completed = o.status === 'Hoàn thành' || partial;
      const escrowStatus: SellerPayoutEscrowStatus = partial
        ? 'partial_refund'
        : completed
          ? 'completed'
          : 'holding';
      return {
        id: o.id,
        date: o.purchaseDate,
        orderId: o.id,
        buyerName: o.buyerName,
        productName: o.productName,
        amountVnd: getSellerPayoutAmountVnd(o),
        orderType: (o.order_type === 'service' ? 'service' : 'product') as 'product' | 'service',
        escrowStatus,
        reason: buildSellerPayoutReason(o, completed, partial),
      };
    })
    .sort((a, b) => {
      const keyA = orderNewestSortKey({ id: a.orderId, purchaseDate: a.date } as Order);
      const keyB = orderNewestSortKey({ id: b.orderId, purchaseDate: b.date } as Order);
      return keyB - keyA;
    });
}

export function buildSellerEscrowReleaseLedgerItem(order: Order): PaymentHistoryItem {
  return {
    id: `sell-${order.id}`,
    date: order.purchaseDate,
    type: 'Selling',
    amount: getSellerPayoutAmountVnd(order),
    reason: `Cộng doanh thu đơn ${order.id} sau thời gian tạm giữ`,
    transactionCode: order.id,
  };
}

export function buildSellerPartialRefundPayoutLedgerItem(order: Order): PaymentHistoryItem {
  const qtyNote =
    order.partialRefundQuantity != null && order.quantity > 0
      ? ` (${order.partialRefundQuantity}/${order.quantity} SP đã hoàn)`
      : '';
  return {
    id: `sell-partial-${order.id}`,
    date: order.purchaseDate,
    type: 'Selling',
    amount: getSellerPayoutAmountVnd(order),
    reason: `Doanh thu phần còn lại — đơn ${order.id} hoàn 1 phần${qtyNote}`,
    transactionCode: order.id,
  };
}

export function sumSellerPayoutByStatus(
  rows: SellerPayoutRow[],
  status: SellerPayoutEscrowStatus
): number {
  return rows.filter(r => r.escrowStatus === status).reduce((s, r) => s + r.amountVnd, 0);
}
