import { getStorefrontSignupByEmail } from '../auth/storefrontDemoAccounts';
import { buildBuyerSellerThreadId } from './storefrontMessagingPersonas';
import { appendThreadMessage } from './storefrontMessagesStorage';
import { pushStorefrontUserNotification } from './storefrontUserNotifications';
import type { SellerRegistrationRequest } from './storefrontSellerRegistration';

export const TAPHOAMMO_SUPPORT_SELLER_KEY = 'taphoammo_ho_tro';
export const TAPHOAMMO_SUPPORT_DISPLAY_NAME = 'TapHoaMMO Hỗ trợ';
export const TAPHOAMMO_PLATFORM_CHAT_LABEL = 'Chat với sàn';

function resolveBuyerLoginForEmail(email: string, fullName: string): string {
  const signup = getStorefrontSignupByEmail(email);
  if (signup?.username?.trim()) return signup.username.trim();
  const local = email.split('@')[0]?.trim();
  if (local) return local;
  return fullName.trim().replace(/\s+/g, '_').toLowerCase() || 'nguoi_ban';
}

export function buildSupportThreadIdForBuyerEmail(email: string, fullName: string): string {
  const buyerLogin = resolveBuyerLoginForEmail(email, fullName);
  return buildBuyerSellerThreadId(buyerLogin, TAPHOAMMO_SUPPORT_SELLER_KEY);
}

export function buildSellerRegistrationApprovedMessage(fullName: string): string {
  const name = fullName.trim() || 'bạn';
  return [
    `Chào ${name}!`,
    '',
    'TapHoaMMO đã duyệt đăng ký bán hàng của bạn.',
    'Bạn có thể bắt đầu tạo gian hàng và đăng sản phẩm trên hệ thống.',
    'Nếu cần hỗ trợ thiết lập gian hàng, hãy phản hồi tin nhắn này.',
  ].join('\n');
}

/** Gửi thông báo + tin nhắn hỗ trợ cho người đăng ký bán hàng sau khi được duyệt. */
export function notifySellerRegistrationApproved(record: SellerRegistrationRequest): void {
  const email = record.email.trim().toLowerCase();
  if (!email) return;

  pushStorefrontUserNotification(email, {
    title: 'Đăng ký bán hàng đã được duyệt',
    content: `Chúc mừng ${record.fullName}! Tài khoản của bạn đã được phép bán hàng trên TapHoaMMO. Xem tin nhắn từ bộ phận hỗ trợ để biết bước tiếp theo.`,
    type: 'success',
    kind: 'seller_registration_approved',
  });

  const threadId = buildSupportThreadIdForBuyerEmail(email, record.fullName);
  appendThreadMessage(email, threadId, 'seller', buildSellerRegistrationApprovedMessage(record.fullName));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('taphoammo-storefront-messages-changed', { detail: { email } })
    );
  }
}
