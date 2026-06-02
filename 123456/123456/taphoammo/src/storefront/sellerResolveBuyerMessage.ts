import type { Order } from '../ordersTypes';
import { computePartialRefundVnd } from '../orderRefund';
import { formatVnd } from '../orderAmountDisplay';
import { appendThreadMessage, appendThreadMessageWithAction } from './storefrontMessagesStorage';
import { resolveBuyerSellerThreadIdFromOrder } from './storefrontMessageThreads';
import { resolveBuyerOwnerEmailForOrder } from './resolveBuyerEmail';
import type { ChatMessageActionKind } from './messageActions';

export type SellerResolveNotifyKind =
  | 'partial_refund'
  | 'warranty_offer'
  | 'dispute'
  | 'full_refund';

export interface SellerResolveNotifyInput {
  sessionFallbackEmail: string;
  order: Order;
  kind: SellerResolveNotifyKind;
  sellerNote?: string;
  partialQuantity?: number;
}

function orderHeaderLines(order: Order): string[] {
  return [
    `Mã đơn: ${order.id}`,
    order.productName ? `Sản phẩm: ${order.productName}` : '',
    order.purchaseDate ? `Thời gian mua: ${order.purchaseDate}` : '',
    `Số lượng: ${order.quantity} · Tổng tiền: ${order.totalAmount}`,
  ].filter(Boolean);
}

/** Gửi tin cho người mua (lưu theo email khách). Trả message id nếu có action. */
export function sendSellerResolveNotifyToBuyer(input: SellerResolveNotifyInput): boolean {
  const { order, kind, sellerNote, partialQuantity, sessionFallbackEmail } = input;
  const buyerEmail = resolveBuyerOwnerEmailForOrder(order, sessionFallbackEmail);
  if (!buyerEmail) return false;

  const threadId = resolveBuyerSellerThreadIdFromOrder(order);
  if (!threadId) return false;

  const note = sellerNote?.trim();
  const header = orderHeaderLines(order);

  if (kind === 'partial_refund' && partialQuantity != null) {
    const refundVnd = computePartialRefundVnd(order, partialQuantity);
    const lines = [
      '[Shop] Đề xuất hoàn tiền một phần cho đơn khiếu nại:',
      ...header,
      `Hoàn: ${formatVnd(refundVnd)} (${partialQuantity}/${order.quantity} SP)`,
      'Vui lòng chọn Đồng ý hoặc Từ chối bên dưới.',
      note ? `Ghi chú shop: ${note}` : '',
    ].filter(Boolean);
    appendThreadMessageWithAction(buyerEmail, threadId, 'seller', lines.join('\n'), {
      kind: 'partial_refund',
      orderId: order.id,
      status: 'pending',
      offerQuantity: partialQuantity,
      orderQuantity: order.quantity,
      refundAmountVnd: refundVnd,
    });
    return true;
  }

  if (kind === 'warranty_offer' && partialQuantity != null) {
    const qty = partialQuantity;
    const lines = [
      '[Shop] Đề xuất bảo hành (gửi lại sản phẩm thay thế):',
      ...header,
      `Số lượng bảo hành: ${qty}/${order.quantity} SP`,
      'Vui lòng chọn Đồng ý hoặc Từ chối bên dưới.',
      note ? `Ghi chú shop: ${note}` : '',
    ].filter(Boolean);
    appendThreadMessageWithAction(buyerEmail, threadId, 'seller', lines.join('\n'), {
      kind: 'warranty',
      orderId: order.id,
      status: 'pending',
      offerQuantity: qty,
      orderQuantity: order.quantity,
    });
    return true;
  }

  if (kind === 'dispute') {
    const lines = [
      '[Shop] Shop đã chuyển đơn sang tranh chấp và gửi phản hồi:',
      ...header,
      note ? `Nội dung: ${note}` : 'Vui lòng xem và phản hồi nếu cần.',
    ].filter(Boolean);
    appendThreadMessage(buyerEmail, threadId, 'seller', lines.join('\n'));
    return true;
  }

  if (kind === 'full_refund') {
    const lines = [
      '[Shop] Shop đã hủy đơn và hoàn tiền toàn bộ:',
      ...header,
      note ? `Ghi chú: ${note}` : '',
    ].filter(Boolean);
    appendThreadMessage(buyerEmail, threadId, 'seller', lines.join('\n'));
    return true;
  }

  return false;
}

export function appendBuyerActionReply(
  ownerEmail: string,
  order: Order,
  accepted: boolean,
  actionKind: ChatMessageActionKind
): void {
  const threadId = resolveBuyerSellerThreadIdFromOrder(order);
  if (!threadId) return;
  const label =
    actionKind === 'partial_refund'
      ? accepted
        ? 'Tôi đồng ý đề xuất hoàn một phần.'
        : 'Tôi từ chối đề xuất hoàn một phần.'
      : accepted
        ? 'Tôi đồng ý nhận bảo hành.'
        : 'Tôi từ chối đề xuất bảo hành.';
  appendThreadMessage(ownerEmail, threadId, 'buyer', label);
}
