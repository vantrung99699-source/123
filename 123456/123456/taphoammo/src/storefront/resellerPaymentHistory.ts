import type { Order } from '../ordersTypes';
import { isPartialRefundOrder } from '../orderRefund';
import { getOrderResellerFeeVnd } from './orderResellerFee';
import type { PaymentHistoryItem } from './paymentHistoryTypes';

export function buildResellerCommissionLedgerItem(order: Order): PaymentHistoryItem | null {
  const amountVnd = getOrderResellerFeeVnd(order);
  if (amountVnd <= 0) return null;
  const partial = isPartialRefundOrder(order);
  const qtyNote =
    partial && order.partialRefundQuantity != null && order.quantity > 0
      ? ` — hoàn ${order.partialRefundQuantity}/${order.quantity} SP`
      : '';
  return {
    id: partial ? `reseller-partial-${order.id}` : `reseller-${order.id}`,
    date: order.purchaseDate,
    type: 'Reseller',
    amount: amountVnd,
    reason: partial
      ? `Hoa hồng Reseller (phần còn lại) đơn ${order.id}${qtyNote}`
      : `Hoa hồng Reseller đơn ${order.id} (đã hoàn thành)`,
    transactionCode: order.id,
  };
}
