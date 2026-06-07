import { appendThreadMessage, mergePlatformSupportThreadMessages } from './storefrontMessagesStorage';
import { pushStorefrontUserNotification } from './storefrontUserNotifications';
import type { SellerRegistrationRequest } from './storefrontSellerRegistration';
import {
  buildSupportThreadIdForBuyerEmail,
  listLegacySupportThreadIds,
  TAPHOAMMO_PLATFORM_CHAT_LABEL,
  TAPHOAMMO_SUPPORT_DISPLAY_NAME,
  TAPHOAMMO_SUPPORT_SELLER_KEY,
} from './storefrontPlatformSupportThread';

export {
  buildSupportThreadIdForBuyerEmail,
  TAPHOAMMO_PLATFORM_CHAT_LABEL,
  TAPHOAMMO_SUPPORT_DISPLAY_NAME,
  TAPHOAMMO_SUPPORT_SELLER_KEY,
} from './storefrontPlatformSupportThread';

function ensureCanonicalSupportThread(email: string, fullName: string): string {
  const threadId = buildSupportThreadIdForBuyerEmail(email);
  mergePlatformSupportThreadMessages(
    email,
    threadId,
    listLegacySupportThreadIds(email, [fullName])
  );
  return threadId;
}

export function buildSellerRegistrationApprovedMessage(fullName: string): string {
  const name = fullName.trim() || 'bạn';
  return [
    `Chào ${name}!`,
    '',
    'Chúc mừng — TapHoaMMO đã duyệt đăng ký bán hàng của bạn.',
    '',
    'Bước tiếp theo để mở gian hàng:',
    '1. Bấm avatar góc phải → chọn «Quản lý cửa hàng»',
    '2. Chọn «Tạo gian hàng mới» và điền đầy đủ thông tin shop',
    '3. Đăng sản phẩm / dịch vụ để bắt đầu kinh doanh',
    '',
    'Nếu cần hỗ trợ thiết lập gian hàng, hãy phản hồi tin nhắn này.',
  ].join('\n');
}

export function buildSellerRegistrationRejectedMessage(fullName: string): string {
  const name = fullName.trim() || 'bạn';
  return [
    `Chào ${name}!`,
    '',
    'Rất tiếc, đơn đăng ký bán hàng của bạn chưa được duyệt tại thời điểm này.',
    'Bạn có thể chỉnh sửa thông tin và gửi lại đăng ký trên storefront (mục Đăng ký bán hàng).',
    'Nếu cần làm rõ thêm, hãy phản hồi tin nhắn này — bộ phận hỗ trợ sẽ liên hệ bạn.',
  ].join('\n');
}

/** Gửi thông báo + tin nhắn hỗ trợ cho người đăng ký bán hàng sau khi được duyệt. */
export function notifySellerRegistrationApproved(record: SellerRegistrationRequest): void {
  const email = record.email.trim().toLowerCase();
  if (!email) return;

  pushStorefrontUserNotification(email, {
    title: 'Đăng ký bán hàng đã được duyệt',
    content: `Chúc mừng ${record.fullName}! Mở Nhắn tin → TapHoaMMO Hỗ trợ để xem hướng dẫn tạo gian hàng mới trong mục «Quản lý cửa hàng».`,
    type: 'success',
    kind: 'seller_registration_approved',
  });

  const threadId = ensureCanonicalSupportThread(email, record.fullName);
  appendThreadMessage(email, threadId, 'seller', buildSellerRegistrationApprovedMessage(record.fullName));

  dispatchSellerRegistrationNotifyEvents(email);
}

/** Gửi thông báo + tin nhắn hỗ trợ khi đơn đăng ký bán hàng bị từ chối. */
export function notifySellerRegistrationRejected(record: SellerRegistrationRequest): void {
  const email = record.email.trim().toLowerCase();
  if (!email) return;

  pushStorefrontUserNotification(email, {
    title: 'Đăng ký bán hàng chưa được duyệt',
    content: `${record.fullName}, đơn đăng ký bán hàng của bạn chưa được chấp nhận. Xem tin nhắn từ TapHoaMMO Hỗ trợ để biết thêm và có thể gửi lại đăng ký sau khi chỉnh sửa.`,
    type: 'warning',
    kind: 'seller_registration_rejected',
  });

  const threadId = ensureCanonicalSupportThread(email, record.fullName);
  appendThreadMessage(email, threadId, 'seller', buildSellerRegistrationRejectedMessage(record.fullName));

  dispatchSellerRegistrationNotifyEvents(email);
}

function dispatchSellerRegistrationNotifyEvents(email: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('taphoammo-storefront-messages-changed', { detail: { email } })
  );
}
