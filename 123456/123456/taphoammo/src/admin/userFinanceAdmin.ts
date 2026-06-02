/**
 * Tổng hợp tài chính người dùng cho Quản lý người dùng (admin).
 */
import type { Order } from '../ordersTypes';
import type { AdminUser, PaymentHistory } from './types';
import { getStorefrontHoVaTenForEmail } from '../auth/storefrontHoVaTenByEmail';
import { getStorefrontRoleWalletVnd } from '../auth/storefrontWalletByRole';
import { getSellerWithdrawHistory } from '../storefront/sellerWithdraw';
import {
  buildSellerPayoutRows,
  getSellerPayoutAmountVnd,
  isOrderForSeller,
} from '../storefront/sellerPaymentHistory';
import {
  getOrderResellerFeeVnd,
  isOrderForResellerReferrer,
} from '../storefront/orderResellerFee';
import { getOrderTotalAmountVnd, parsePriceToVndNumber } from '../orderAmountDisplay';
import { getAdminUserLedgerEntries, type AdminUserLedgerEntry } from './userProfileAdmin';

export interface UserLedgerLine {
  id: string;
  date: string;
  amountVnd: number;
  typeLabel: string;
  reason: string;
  code: string;
}

export interface ResellerOrderDetail {
  orderId: string;
  date: string;
  productName: string;
  commissionVnd: number;
  buyerName: string;
}

export function collectAdminUserIdentityKeys(user: AdminUser): Set<string> {
  const keys = new Set<string>();
  const push = (s?: string) => {
    const t = s?.trim().toLowerCase();
    if (t) keys.add(t);
  };
  push(user.email);
  push(user.username);
  push(user.name);
  push(getStorefrontHoVaTenForEmail(user.email));
  return keys;
}

export function isOrderForAdminBuyer(order: Order, keys: Set<string>): boolean {
  const bn = order.buyerName?.trim().toLowerCase();
  return Boolean(bn && keys.has(bn));
}

function paymentHistoryMatchesUser(row: PaymentHistory, user: AdminUser, keys: Set<string>): boolean {
  const uid = row.userId?.trim().toLowerCase();
  const name = row.name?.trim().toLowerCase();
  if (uid && keys.has(uid)) return true;
  if (name && keys.has(name)) return true;
  if (uid && uid === user.email.trim().toLowerCase()) return true;
  if (name && name === user.username.trim().toLowerCase()) return true;
  return false;
}

function ledgerKindLabel(kind: AdminUserLedgerEntry['kind']): string {
  switch (kind) {
    case 'topup':
      return 'Nạp tiền';
    case 'deduct':
      return 'Trừ tiền';
    case 'set_balance':
      return 'Đặt số dư';
    case 'purchase':
      return 'Mua hàng';
    case 'sale':
      return 'Bán hàng';
    case 'reseller':
      return 'Reseller';
    case 'withdraw':
      return 'Rút tiền';
    case 'refund':
      return 'Hoàn tiền';
    default:
      return 'Khác';
  }
}

function formatLedgerDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function getUserResellerWalletVnd(email: string): number {
  return getStorefrontRoleWalletVnd(email, 'reseller');
}

export function getUserSellerRoleWalletVnd(email: string): number {
  return getStorefrontRoleWalletVnd(email, 'seller');
}

export function getUserResellerCommissionTotalVnd(user: AdminUser, orders: Order[]): number {
  let sum = 0;
  for (const o of orders) {
    if (o.checkoutPaid !== true) continue;
    if (
      isOrderForResellerReferrer(
        o,
        user.email,
        user.name,
        user.username,
        [...collectAdminUserIdentityKeys(user)]
      )
    ) {
      sum += getOrderResellerFeeVnd(o);
    }
  }
  return sum;
}

export function getUserResellerOrderDetails(user: AdminUser, orders: Order[]): ResellerOrderDetail[] {
  const keys = collectAdminUserIdentityKeys(user);
  return orders
    .filter(
      o =>
        o.checkoutPaid === true &&
        isOrderForResellerReferrer(o, user.email, user.name, user.username, [...keys])
    )
    .map(o => ({
      orderId: o.id,
      date: o.purchaseDate,
      productName: o.productName,
      commissionVnd: getOrderResellerFeeVnd(o),
      buyerName: o.buyerName,
    }))
    .filter(r => r.commissionVnd > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getUserSellerPayoutTotalVnd(user: AdminUser, orders: Order[]): number {
  const keys = collectAdminUserIdentityKeys(user);
  let sum = 0;
  for (const o of orders) {
    if (o.checkoutPaid !== true || !isOrderForSeller(o, keys)) continue;
    sum += getSellerPayoutAmountVnd(o);
  }
  return sum;
}

export function getUserSellerPayoutRows(user: AdminUser, orders: Order[]) {
  return buildSellerPayoutRows(orders, collectAdminUserIdentityKeys(user));
}

export function buildUserPaymentLedgerLines(
  user: AdminUser,
  orders: Order[],
  extraPaymentHistory: PaymentHistory[] = []
): UserLedgerLine[] {
  const keys = collectAdminUserIdentityKeys(user);
  const lines: UserLedgerLine[] = [];

  for (const row of extraPaymentHistory) {
    if (!paymentHistoryMatchesUser(row, user, keys)) continue;
    const amount = parsePriceToVndNumber(row.amount);
    const signed =
      row.type === 'Rút tiền' || row.type === 'Mua hàng'
        ? -Math.abs(amount)
        : Math.abs(amount);
    lines.push({
      id: `ph-${row.id}`,
      date: row.time,
      amountVnd: signed,
      typeLabel: row.type,
      reason: row.reason || row.calculation || '—',
      code: row.id,
    });
  }

  for (const o of orders) {
    if (o.checkoutPaid !== true) continue;

    if (isOrderForAdminBuyer(o, keys)) {
      const total = getOrderTotalAmountVnd(o);
      if (total > 0) {
        lines.push({
          id: `buy-${o.id}`,
          date: o.purchaseDate,
          amountVnd: -total,
          typeLabel: 'Mua hàng',
          reason: `Thanh toán đơn ${o.id} — ${o.productName}`,
          code: o.id,
        });
      }
    }

    if (isOrderForSeller(o, keys)) {
      const payout = getSellerPayoutAmountVnd(o);
      if (payout > 0) {
        const completed = o.status === 'Hoàn thành';
        lines.push({
          id: `sell-${o.id}`,
          date: o.purchaseDate,
          amountVnd: completed ? payout : 0,
          typeLabel: completed ? 'Bán hàng' : 'Tạm giữ (bán)',
          reason: completed
            ? `Doanh thu đơn ${o.id} — ${o.productName}`
            : `Tiền tạm giữ — đơn ${o.id}`,
          code: o.id,
        });
      }
    }

    if (
      isOrderForResellerReferrer(o, user.email, user.name, user.username, [...keys])
    ) {
      const fee = getOrderResellerFeeVnd(o);
      if (fee > 0) {
        lines.push({
          id: `res-${o.id}`,
          date: o.purchaseDate,
          amountVnd: fee,
          typeLabel: 'Reseller',
          reason: `Hoa hồng đơn ${o.id} — ${o.productName}`,
          code: o.id,
        });
      }
    }
  }

  for (const w of getSellerWithdrawHistory(user.email)) {
    lines.push({
      id: w.id,
      date: new Date(w.createdAtMs).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      amountVnd: -w.amountVnd,
      typeLabel: 'Rút tiền',
      reason: `Rút về ${w.bankName} — ${w.accountNumber}`,
      code: w.id,
    });
  }

  for (const e of getAdminUserLedgerEntries(user.email)) {
    lines.push({
      id: e.id,
      date: formatLedgerDate(e.atIso),
      amountVnd: e.amountVnd,
      typeLabel: ledgerKindLabel(e.kind),
      reason: e.detail ? `${e.label} — ${e.detail}` : e.label,
      code: e.id,
    });
  }

  return lines.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
