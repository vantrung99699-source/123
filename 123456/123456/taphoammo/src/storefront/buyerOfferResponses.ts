import type { Order } from '../ordersTypes';

export function getPartialRefundAcceptPatch(order: Order): Partial<Order> {
  return {
    status: 'Thất bại',
    refundOfferStatus: 'accepted',
    failureKind: 'buyer_accepted_partial_refund',
  };
}

export function getPartialRefundRejectPatch(): Partial<Order> {
  return {
    refundOfferStatus: 'rejected',
    refund: '0đ',
    partialRefundQuantity: undefined,
    status: 'Khiếu nại',
  };
}
