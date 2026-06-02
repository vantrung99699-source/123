import type { Order } from '../ordersTypes';
import { listStorefrontSignups } from '../auth/storefrontDemoAccounts';

/** Email lưu hội thoại localStorage của người mua (demo: khớp username đăng ký). */
export function resolveBuyerOwnerEmailForOrder(order: Order, fallbackEmail: string): string {
  const login = order.buyerName?.trim().toLowerCase();
  if (login) {
    for (const row of listStorefrontSignups()) {
      if (row.username.trim().toLowerCase() === login) return row.email;
    }
  }
  return fallbackEmail.trim();
}
