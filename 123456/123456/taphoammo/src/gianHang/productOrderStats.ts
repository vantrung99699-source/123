import type { Order } from '../ordersTypes';
import { parsePurchaseDateToMs } from '../ordersTypes';
import type { Product } from './types';

const TWO_MONTH_DAYS = 62;

export interface ProductOrderStatsSummary {
  ordersToday: number;
  ordersAllTime: number;
  complaintTotal: number;
  complaintsToday: number;
  disputeTotal: number;
}

function isComplaintOrder(order: Order): boolean {
  return Boolean(order.hasComplained || order.status === 'Khiếu nại' || order.complaintStartedAtMs);
}

function complaintTimeMs(order: Order): number | undefined {
  if (order.complaintStartedAtMs) return order.complaintStartedAtMs;
  if (order.status === 'Khiếu nại' || order.hasComplained) return orderTimeMs(order) || undefined;
  return undefined;
}

export interface ProductOrderChartPoint {
  dayKey: string;
  label: string;
  monthLabel: string;
  orderCount: number;
}

function orderTimeMs(order: Order): number {
  return order.createdAtMs ?? parsePurchaseDateToMs(order.purchaseDate) ?? 0;
}

export function orderMatchesProduct(order: Order, product: Product): boolean {
  if (order.adminMatHangId === product.id) return true;
  if (!order.adminMatHangId?.trim() && order.productName?.trim() === product.name?.trim()) {
    return true;
  }
  return false;
}

export function filterOrdersForProduct(orders: Order[], product: Product): Order[] {
  return orders.filter(o => orderMatchesProduct(o, product) && o.checkoutPaid === true);
}

function isSameCalendarDay(ms: number, ref = new Date()): boolean {
  const d = new Date(ms);
  return (
    d.getDate() === ref.getDate() &&
    d.getMonth() === ref.getMonth() &&
    d.getFullYear() === ref.getFullYear()
  );
}

function formatDayLabel(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

function formatMonthLabel(ms: number): string {
  const d = new Date(ms);
  return `T${d.getMonth() + 1}/${d.getFullYear()}`;
}

function dayKeyFromMs(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildProductOrderStatsSummary(orders: Order[]): ProductOrderStatsSummary {
  const now = Date.now();
  let ordersToday = 0;
  let complaintTotal = 0;
  let complaintsToday = 0;
  let disputeTotal = 0;
  const today = new Date(now);

  for (const o of orders) {
    const ms = orderTimeMs(o);
    if (ms && isSameCalendarDay(ms, today)) ordersToday += 1;
    if (isComplaintOrder(o)) {
      complaintTotal += 1;
      const complaintMs = complaintTimeMs(o);
      if (complaintMs && isSameCalendarDay(complaintMs, today)) complaintsToday += 1;
    }
    if (o.status === 'Tranh chấp' || o.disputeStartedAtMs) disputeTotal += 1;
  }

  return {
    ordersToday,
    ordersAllTime: orders.length,
    complaintTotal,
    complaintsToday,
    disputeTotal,
  };
}

/** Biểu đồ số đơn theo ngày — 2 tháng gần nhất (≈62 ngày). */
export function buildTwoMonthProductOrderChart(orders: Order[], nowMs = Date.now()): ProductOrderChartPoint[] {
  const dayMs = 86_400_000;
  const end = new Date(nowMs);
  end.setHours(23, 59, 59, 999);
  const rangeStartMs = end.getTime() - (TWO_MONTH_DAYS - 1) * dayMs;

  const buckets = new Map<string, ProductOrderChartPoint>();
  const cursor = new Date(rangeStartMs);
  cursor.setHours(0, 0, 0, 0);
  while (cursor.getTime() <= end.getTime()) {
    const ms = cursor.getTime();
    const key = dayKeyFromMs(ms);
    buckets.set(key, {
      dayKey: key,
      label: formatDayLabel(ms),
      monthLabel: formatMonthLabel(ms),
      orderCount: 0,
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
  }

  return [...buckets.values()].sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}
