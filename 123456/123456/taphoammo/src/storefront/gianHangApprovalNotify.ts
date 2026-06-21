import { listStorefrontSignups } from '../auth/storefrontDemoAccounts';
import { STOREFRONT_VIRTUAL_ACCOUNT } from '../auth/roles';
import type { Category } from '../gianHang/types';
import { getSellerRegistrationByEmail, listSellerRegistrations } from './storefrontSellerRegistration';
import { pushStorefrontUserNotification } from './storefrontUserNotifications';

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Xác định email người bán từ dữ liệu gian hàng (ưu tiên `createdByEmail`). */
export function resolveGianHangOwnerEmail(cat: Category): string | null {
  if (cat.createdByEmail?.trim()) return normEmail(cat.createdByEmail);

  const sellerKey = (cat.sellerDisplayName || '').trim();
  if (looksLikeEmail(sellerKey)) return normEmail(sellerKey);

  if (sellerKey) {
    const signup = listStorefrontSignups().find(
      s => s.username.trim().toLowerCase() === sellerKey.toLowerCase()
    );
    if (signup?.email.trim()) return normEmail(signup.email);

    if (sellerKey.toLowerCase() === STOREFRONT_VIRTUAL_ACCOUNT.username.toLowerCase()) {
      return normEmail(STOREFRONT_VIRTUAL_ACCOUNT.email);
    }
  }

  const displayName = (cat.createdByName || '').trim();
  if (displayName) {
    const reg = listSellerRegistrations().find(
      r =>
        r.status === 'approved' &&
        r.fullName.trim().toLowerCase() === displayName.toLowerCase()
    );
    if (reg?.email.trim()) return normEmail(reg.email);
  }

  return null;
}

/** Thông báo bell storefront khi admin phê duyệt gian hàng. */
export function notifyGianHangApproved(cat: Category): void {
  const email = resolveGianHangOwnerEmail(cat);
  if (!email) return;

  const shopName = cat.name.trim() || 'Gian hàng của bạn';
  const sellerName =
    getSellerRegistrationByEmail(email)?.fullName.trim() ||
    cat.createdByName?.trim() ||
    cat.sellerDisplayName?.trim() ||
    'bạn';

  pushStorefrontUserNotification(email, {
    title: 'Phê duyệt gian hàng thành công',
    content: `Chúc mừng ${sellerName}! Gian hàng «${shopName}» đã được duyệt. Vào Quản lý cửa hàng để đăng mặt hàng và bắt đầu bán.`,
    type: 'success',
    kind: 'gian_hang_approved',
  });
}
