import type { Order } from '../ordersTypes';
import { appendThreadMessage } from './storefrontMessagesStorage';
import { resolveBuyerSellerThreadIdFromOrder } from './storefrontMessageThreads';

export interface ComplaintMessagingSession {
  login: string;
  displayName: string;
  email: string;
}

/** Gửi tin nhắn tự động cho người bán khi khách xác nhận khiếu nại. */
export function sendComplaintAutoMessageToSeller(
  ownerEmail: string,
  order: Order,
  complaintReason: string,
  _session: ComplaintMessagingSession
): boolean {
  const email = ownerEmail.trim();
  const reason = complaintReason.trim();
  if (!email || !reason) return false;

  const threadId = resolveBuyerSellerThreadIdFromOrder(order);
  if (!threadId) return false;

  const lines = [
    '[Tự động] Tôi đã gửi khiếu nại về đơn hàng này.',
    `Mã đơn: ${order.id}`,
    order.productName ? `Sản phẩm: ${order.productName}` : null,
    order.purchaseDate ? `Thời gian mua: ${order.purchaseDate}` : null,
    `Số lượng: ${order.quantity} · Tổng tiền: ${order.totalAmount}`,
    `Nội dung khiếu nại: ${reason}`,
    'Vui lòng xem và phản hồi sớm. Cảm ơn shop!',
  ].filter((line): line is string => Boolean(line));

  appendThreadMessage(email, threadId, 'buyer', lines.join('\n'));
  return true;
}
