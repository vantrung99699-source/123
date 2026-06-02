import type { Order } from '../ordersTypes';
import { parsePurchaseDateToMs } from '../ordersTypes';
import { getOrderFeeBasisTotalVnd, isPartialRefundOrder } from '../orderRefund';
import { getOrderPlatformFeeVnd } from '../storefront/orderPlatformFee';
import { getOrderResellerFeeVnd } from '../storefront/orderResellerFee';
import {
  getSellerPayoutAmountVnd,
  isOrderForSeller,
  sumSellerPayoutByStatus,
  buildSellerPayoutRows,
} from '../storefront/sellerPaymentHistory';
import { isWarrantyReplacementOrder } from '../storefront/warrantyOffer';

export type RevenuePeriod = 'all' | '7d' | '30d' | 'month';

export interface SellerRevenueSummary {
  orderCount: number;
  grossVnd: number;
  platformFeeVnd: number;
  resellerFeeVnd: number;
  netPayoutVnd: number;
  holdingVnd: number;
  completedVnd: number;
  partialRefundVnd: number;
  productCount: number;
  serviceCount: number;
  complaintCount: number;
  failedCount: number;
}

export interface SellerRevenueBySellerRow {
  sellerName: string;
  orderCount: number;
  grossVnd: number;
  platformFeeVnd: number;
  resellerFeeVnd: number;
  netPayoutVnd: number;
  holdingVnd: number;
  completedVnd: number;
}

export interface SellerRevenueOrderRow {
  orderId: string;
  purchaseDate: string;
  productName: string;
  buyerName: string;
  status: string;
  grossVnd: number;
  platformFeeVnd: number;
  resellerFeeVnd: number;
  netPayoutVnd: number;
  orderType: 'product' | 'service';
}

function orderTimeMs(order: Order): number {
  return order.createdAtMs ?? parsePurchaseDateToMs(order.purchaseDate) ?? 0;
}

export function isOrderInRevenuePeriod(order: Order, period: RevenuePeriod, nowMs = Date.now()): boolean {
  if (period === 'all') return true;
  const ms = orderTimeMs(order);
  if (!ms) return true;
  const day = 86_400_000;
  if (period === '7d') return nowMs - ms <= 7 * day;
  if (period === '30d') return nowMs - ms <= 30 * day;
  const d = new Date(ms);
  const n = new Date(nowMs);
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

export function isRevenueStatsOrder(order: Order): boolean {
  if (isWarrantyReplacementOrder(order)) return false;
  return order.checkoutPaid === true;
}

export function filterOrdersForRevenueStats(
  orders: Order[],
  options: {
    period: RevenuePeriod;
    sellerKeys?: Set<string>;
    nowMs?: number;
  }
): Order[] {
  const { period, sellerKeys, nowMs } = options;
  return orders.filter(o => {
    if (!isRevenueStatsOrder(o)) return false;
    if (sellerKeys && !isOrderForSeller(o, sellerKeys)) return false;
    return isOrderInRevenuePeriod(o, period, nowMs);
  });
}

export function buildSellerRevenueSummary(orders: Order[]): SellerRevenueSummary {
  let grossVnd = 0;
  let platformFeeVnd = 0;
  let resellerFeeVnd = 0;
  let netPayoutVnd = 0;
  let productCount = 0;
  let serviceCount = 0;
  let complaintCount = 0;
  let failedCount = 0;

  for (const o of orders) {
    grossVnd += getOrderFeeBasisTotalVnd(o);
    platformFeeVnd += getOrderPlatformFeeVnd(o);
    resellerFeeVnd += getOrderResellerFeeVnd(o);
    netPayoutVnd += getSellerPayoutAmountVnd(o);
    if (o.order_type === 'service') serviceCount += 1;
    else productCount += 1;
    if (o.status === 'Khiếu nại' || o.status === 'Tranh chấp') complaintCount += 1;
    if (o.status === 'Thất bại') failedCount += 1;
  }

  const keys = new Set<string>();
  for (const o of orders) {
    const sn = o.sellerName?.trim();
    if (sn) keys.add(sn);
  }
  const payoutRows = keys.size > 0 ? buildSellerPayoutRows(orders, keys) : [];

  return {
    orderCount: orders.length,
    grossVnd,
    platformFeeVnd,
    resellerFeeVnd,
    netPayoutVnd,
    holdingVnd: sumSellerPayoutByStatus(payoutRows, 'holding'),
    completedVnd: sumSellerPayoutByStatus(payoutRows, 'completed'),
    partialRefundVnd: sumSellerPayoutByStatus(payoutRows, 'partial_refund'),
    productCount,
    serviceCount,
    complaintCount,
    failedCount,
  };
}

export function buildSellerRevenueBySellerRows(orders: Order[]): SellerRevenueBySellerRow[] {
  const map = new Map<string, SellerRevenueBySellerRow>();

  for (const o of orders) {
    const sellerName = o.sellerName?.trim() || '—';
    const row =
      map.get(sellerName) ??
      ({
        sellerName,
        orderCount: 0,
        grossVnd: 0,
        platformFeeVnd: 0,
        resellerFeeVnd: 0,
        netPayoutVnd: 0,
        holdingVnd: 0,
        completedVnd: 0,
      } satisfies SellerRevenueBySellerRow);

    row.orderCount += 1;
    row.grossVnd += getOrderFeeBasisTotalVnd(o);
    row.platformFeeVnd += getOrderPlatformFeeVnd(o);
    row.resellerFeeVnd += getOrderResellerFeeVnd(o);
    row.netPayoutVnd += getSellerPayoutAmountVnd(o);

    if (o.status === 'Tạm giữ tiền') {
      row.holdingVnd += getSellerPayoutAmountVnd(o);
    } else if (o.status === 'Hoàn thành' || (isPartialRefundOrder(o) && o.refundOfferStatus === 'accepted')) {
      row.completedVnd += getSellerPayoutAmountVnd(o);
    }

    map.set(sellerName, row);
  }

  return [...map.values()].sort((a, b) => b.netPayoutVnd - a.netPayoutVnd);
}

export function buildSellerRevenueOrderRows(orders: Order[]): SellerRevenueOrderRow[] {
  return [...orders]
    .sort((a, b) => orderTimeMs(b) - orderTimeMs(a))
    .map(o => ({
      orderId: o.id,
      purchaseDate: o.purchaseDate,
      productName: o.productName,
      buyerName: o.buyerName,
      status: o.status,
      grossVnd: getOrderFeeBasisTotalVnd(o),
      platformFeeVnd: getOrderPlatformFeeVnd(o),
      resellerFeeVnd: getOrderResellerFeeVnd(o),
      netPayoutVnd: getSellerPayoutAmountVnd(o),
      orderType: o.order_type === 'service' ? 'service' : 'product',
    }));
}

export const REVENUE_PERIOD_LABELS: Record<RevenuePeriod, string> = {
  all: 'Tất cả thời gian',
  month: 'Tháng này',
  '30d': '30 ngày qua',
  '7d': '7 ngày qua',
};

export interface DailyRevenueChartPoint {
  dayKey: string;
  label: string;
  orderCount: number;
  grossVnd: number;
  netPayoutVnd: number;
}

function formatDayLabel(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

function dayKeyFromMs(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Số ngày hiển thị trên biểu đồ theo kỳ lọc. */
export function getRevenueChartDayCount(period: RevenuePeriod, nowMs = Date.now()): number {
  if (period === '7d') return 7;
  if (period === '30d') return 30;
  if (period === 'month') {
    const n = new Date(nowMs);
    const lastDay = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
    return lastDay;
  }
  return 30;
}

/** Gom đơn theo ngày — phục vụ biểu đồ tổng đơn & tổng tiền. */
export function buildDailyRevenueChartSeries(
  orders: Order[],
  period: RevenuePeriod,
  nowMs = Date.now()
): DailyRevenueChartPoint[] {
  const dayMs = 86_400_000;
  const span = getRevenueChartDayCount(period, nowMs);
  const end = new Date(nowMs);
  end.setHours(23, 59, 59, 999);

  let rangeStartMs: number;
  if (period === 'month') {
    rangeStartMs = new Date(end.getFullYear(), end.getMonth(), 1).getTime();
  } else if (period === 'all') {
    rangeStartMs = end.getTime() - (span - 1) * dayMs;
  } else {
    rangeStartMs = end.getTime() - (span - 1) * dayMs;
  }

  const buckets = new Map<string, DailyRevenueChartPoint>();
  const cursor = new Date(rangeStartMs);
  cursor.setHours(0, 0, 0, 0);
  while (cursor.getTime() <= end.getTime()) {
    const ms = cursor.getTime();
    const key = dayKeyFromMs(ms);
    buckets.set(key, {
      dayKey: key,
      label: formatDayLabel(ms),
      orderCount: 0,
      grossVnd: 0,
      netPayoutVnd: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const o of orders) {
    const ms = orderTimeMs(o);
    if (!ms) continue;
    const key = dayKeyFromMs(ms);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.orderCount += 1;
    bucket.grossVnd += getOrderFeeBasisTotalVnd(o);
    bucket.netPayoutVnd += getSellerPayoutAmountVnd(o);
  }

  return [...buckets.values()].sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}
