/**
 * Tổng hợp giao dịch toàn hệ thống cho admin — người mua / người bán / Reseller.
 */
import type { Order } from '../ordersTypes';
import type { AdminUser, PaymentHistory } from './types';
import { ADMIN_USERS } from './data';
import { mergeAdminUsersWithStorefront } from './mergeStorefrontUsersForAdmin';
import { getAdminUserBalanceVnd } from '../auth/storefrontWalletByEmail';
import { getStorefrontRoleWalletVnd } from '../auth/storefrontWalletByRole';
import { getStorefrontHoVaTenForEmail } from '../auth/storefrontHoVaTenByEmail';
import { getSellerWithdrawnVnd } from '../storefront/sellerWithdraw';
import {
  getOrderResellerFeeVnd,
  isOrderForResellerReferrer,
  collectResellerReferrerIdentityKeys,
} from '../storefront/orderResellerFee';
import { getSellerPayoutAmountVnd } from '../storefront/sellerPaymentHistory';
import { getOrderTotalAmountVnd, parsePriceToVndNumber } from '../orderAmountDisplay';
import { PAYMENT_HISTORY } from './data';

export type TransactionPartyRole = 'buyer' | 'seller' | 'reseller' | 'other';

export interface SystemLedgerRow {
  id: string;
  time: string;
  timeMs: number;
  role: TransactionPartyRole;
  partyKey: string;
  partyLabel: string;
  type: PaymentHistory['type'];
  amountVnd: number;
  orderId?: string;
  productName?: string;
  counterparty?: string;
  reason: string;
}

export interface ProductAgg {
  name: string;
  count: number;
  totalVnd: number;
}

export interface BuyerPartySummary {
  key: string;
  label: string;
  email: string;
  walletVnd: number;
  totalSpentVnd: number;
  totalRefundVnd: number;
  orderCount: number;
  topProducts: ProductAgg[];
}

export interface SellerPartySummary {
  key: string;
  label: string;
  email: string;
  walletVnd: number;
  withdrawnVnd: number;
  availableVnd: number;
  totalSalesVnd: number;
  orderCount: number;
  topProducts: ProductAgg[];
}

export interface ResellerPartySummary {
  key: string;
  label: string;
  email: string;
  walletVnd: number;
  totalCommissionVnd: number;
  orderCount: number;
  topProducts: ProductAgg[];
}

export interface SystemTransactionOverview {
  ledger: SystemLedgerRow[];
  buyers: BuyerPartySummary[];
  sellers: SellerPartySummary[];
  resellers: ResellerPartySummary[];
  totals: {
    ledgerCount: number;
    buyerSpentVnd: number;
    sellerSalesVnd: number;
    resellerCommissionVnd: number;
    totalBuyerWalletVnd: number;
    totalSellerWalletVnd: number;
    totalResellerWalletVnd: number;
  };
}

function normKey(s: string): string {
  return s.trim().toLowerCase();
}

function orderDateToMs(s: string): number {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  const t = new Date(
    parseInt(m[3], 10),
    parseInt(m[2], 10) - 1,
    parseInt(m[1], 10),
    parseInt(m[4], 10),
    parseInt(m[5], 10)
  ).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function parseSignedAmountVnd(amount: string): number {
  const n = parsePriceToVndNumber(amount);
  const t = amount.trim();
  if (t.startsWith('-')) return -n;
  if (t.startsWith('+')) return n;
  return n;
}

function bumpProduct(map: Map<string, ProductAgg>, name: string, vnd: number) {
  const k = name.trim() || '—';
  const prev = map.get(k) ?? { name: k, count: 0, totalVnd: 0 };
  map.set(k, { name: k, count: prev.count + 1, totalVnd: prev.totalVnd + vnd });
}

function topProductsFromMap(map: Map<string, ProductAgg>, limit = 5): ProductAgg[] {
  return [...map.values()].sort((a, b) => b.totalVnd - a.totalVnd).slice(0, limit);
}

function resolveUserByIdentity(
  users: AdminUser[],
  identity: string
): AdminUser | undefined {
  const k = normKey(identity);
  return users.find(
    u =>
      normKey(u.username) === k ||
      normKey(u.email) === k ||
      normKey(u.name) === k ||
      normKey(getStorefrontHoVaTenForEmail(u.email)) === k
  );
}

function emailForBuyerKey(key: string, users: AdminUser[]): string {
  const u = resolveUserByIdentity(users, key);
  return u?.email.trim().toLowerCase() ?? '';
}

export function buildSystemTransactionOverview(
  orders: Order[],
  extraRows: PaymentHistory[] = [],
  mockRows: PaymentHistory[] = PAYMENT_HISTORY
): SystemTransactionOverview {
  const users = mergeAdminUsersWithStorefront(ADMIN_USERS);
  const ledger: SystemLedgerRow[] = [];

  const buyerMap = new Map<string, { label: string; spent: number; refund: number; orders: number; products: Map<string, ProductAgg> }>();
  const sellerMap = new Map<string, { label: string; sales: number; orders: number; products: Map<string, ProductAgg> }>();
  const resellerMap = new Map<string, { label: string; commission: number; orders: number; products: Map<string, ProductAgg> }>();

  const ensureBuyer = (key: string, label: string) => {
    const k = normKey(key);
    if (!buyerMap.has(k)) buyerMap.set(k, { label, spent: 0, refund: 0, orders: 0, products: new Map() });
    return buyerMap.get(k)!;
  };

  const ensureSeller = (key: string, label: string) => {
    const k = normKey(key);
    if (!sellerMap.has(k)) sellerMap.set(k, { label, sales: 0, orders: 0, products: new Map() });
    return sellerMap.get(k)!;
  };

  const ensureReseller = (key: string, label: string) => {
    const k = normKey(key);
    if (!resellerMap.has(k)) resellerMap.set(k, { label, commission: 0, orders: 0, products: new Map() });
    return resellerMap.get(k)!;
  };

  for (const o of orders) {
    if (!o.checkoutPaid) continue;
    const ms = orderDateToMs(o.purchaseDate) || o.createdAtMs || 0;
    const total = getOrderTotalAmountVnd(o);
    const buyerKey = normKey(o.buyerName || '—');
    const buyerLabel = o.buyerName?.trim() || '—';

    if (total > 0) {
      const b = ensureBuyer(buyerKey, buyerLabel);
      b.spent += total;
      b.orders += 1;
      bumpProduct(b.products, o.productName, total);

      ledger.push({
        id: `buy-${o.id}`,
        time: o.purchaseDate,
        timeMs: ms,
        role: 'buyer',
        partyKey: buyerKey,
        partyLabel: buyerLabel,
        type: 'Mua hàng',
        amountVnd: -total,
        orderId: o.id,
        productName: o.productName,
        counterparty: o.sellerName,
        reason: `Mua — ${o.productName}`,
      });
    }

    const sellerKey = normKey(o.sellerName || '');
    if (sellerKey) {
      const payout = getSellerPayoutAmountVnd(o);
      const s = ensureSeller(sellerKey, o.sellerName!.trim());
      s.sales += payout;
      s.orders += 1;
      bumpProduct(s.products, o.productName, payout);

      ledger.push({
        id: `sell-${o.id}`,
        time: o.purchaseDate,
        timeMs: ms,
        role: 'seller',
        partyKey: sellerKey,
        partyLabel: o.sellerName!.trim(),
        type: 'Bán hàng',
        amountVnd: payout,
        orderId: o.id,
        productName: o.productName,
        counterparty: o.buyerName,
        reason: `Bán — ${o.productName}`,
      });
    }

    for (const u of users) {
      if (
        !isOrderForResellerReferrer(
          o,
          u.email,
          u.name,
          u.username,
          [...collectResellerReferrerIdentityKeys(u.email, u.name, u.username)]
        )
      ) {
        continue;
      }
      const fee = getOrderResellerFeeVnd(o);
      if (fee <= 0) continue;
      const rKey = normKey(u.email);
      const rLabel = getStorefrontHoVaTenForEmail(u.email) || u.username;
      const r = ensureReseller(rKey, rLabel);
      r.commission += fee;
      r.orders += 1;
      bumpProduct(r.products, o.productName, fee);

      ledger.push({
        id: `res-${o.id}-${rKey}`,
        time: o.purchaseDate,
        timeMs: ms,
        role: 'reseller',
        partyKey: rKey,
        partyLabel: rLabel,
        type: 'Bán hàng',
        amountVnd: fee,
        orderId: o.id,
        productName: o.productName,
        counterparty: o.buyerName,
        reason: `Hoa hồng Reseller — ${o.productName}`,
      });
      break;
    }
  }

  for (const row of [...extraRows, ...mockRows]) {
    const ms = orderDateToMs(row.time);
    const amountVnd = parseSignedAmountVnd(row.amount);
    let role: TransactionPartyRole = 'other';
    if (row.type === 'Mua hàng' || row.type === 'Hoàn tiền' || row.type === 'Nạp tiền' || row.type === 'Rút tiền') {
      role = 'buyer';
    } else if (row.type === 'Bán hàng') {
      role = 'seller';
    }
    ledger.push({
      id: `ext-${row.id}`,
      time: row.time,
      timeMs: ms,
      role,
      partyKey: normKey(row.userId || row.name),
      partyLabel: row.name || row.userId,
      type: row.type,
      amountVnd,
      orderId: row.id,
      reason: row.reason,
      counterparty: row.sellerName,
    });

    if (row.type === 'Nạp tiền' && amountVnd > 0) {
      ensureBuyer(normKey(row.userId || row.name), row.name);
    }
  }

  ledger.sort((a, b) => b.timeMs - a.timeMs);

  const buyers: BuyerPartySummary[] = [...buyerMap.entries()]
    .map(([key, v]) => {
      const email = emailForBuyerKey(key, users) || key;
      return {
        key,
        label: v.label,
        email,
        walletVnd: email.includes('@') ? getAdminUserBalanceVnd(email, 0) : 0,
        totalSpentVnd: v.spent,
        totalRefundVnd: v.refund,
        orderCount: v.orders,
        topProducts: topProductsFromMap(v.products),
      };
    })
    .sort((a, b) => b.totalSpentVnd - a.totalSpentVnd);

  const sellers: SellerPartySummary[] = [...sellerMap.entries()]
    .map(([key, v]) => {
      const u = resolveUserByIdentity(users, key);
      const email = u?.email ?? '';
      const wallet = email ? getStorefrontRoleWalletVnd(email, 'seller') : 0;
      const withdrawn = email ? getSellerWithdrawnVnd(email) : 0;
      return {
        key,
        label: v.label,
        email,
        walletVnd: wallet,
        withdrawnVnd: withdrawn,
        availableVnd: Math.max(0, wallet),
        totalSalesVnd: v.sales,
        orderCount: v.orders,
        topProducts: topProductsFromMap(v.products),
      };
    })
    .sort((a, b) => b.totalSalesVnd - a.totalSalesVnd);

  const resellers: ResellerPartySummary[] = [...resellerMap.entries()]
    .map(([key, v]) => ({
      key,
      label: v.label,
      email: key,
      walletVnd: getStorefrontRoleWalletVnd(key, 'reseller'),
      totalCommissionVnd: v.commission,
      orderCount: v.orders,
      topProducts: topProductsFromMap(v.products),
    }))
    .sort((a, b) => b.totalCommissionVnd - a.totalCommissionVnd);

  let totalBuyerWalletVnd = 0;
  let totalSellerWalletVnd = 0;
  let totalResellerWalletVnd = 0;
  for (const u of users) {
    totalBuyerWalletVnd += getAdminUserBalanceVnd(u.email, 0);
    totalSellerWalletVnd += getStorefrontRoleWalletVnd(u.email, 'seller');
    totalResellerWalletVnd += getStorefrontRoleWalletVnd(u.email, 'reseller');
  }

  return {
    ledger,
    buyers,
    sellers,
    resellers,
    totals: {
      ledgerCount: ledger.length,
      buyerSpentVnd: buyers.reduce((s, b) => s + b.totalSpentVnd, 0),
      sellerSalesVnd: sellers.reduce((s, x) => s + x.totalSalesVnd, 0),
      resellerCommissionVnd: resellers.reduce((s, r) => s + r.totalCommissionVnd, 0),
      totalBuyerWalletVnd,
      totalSellerWalletVnd,
      totalResellerWalletVnd,
    },
  };
}
