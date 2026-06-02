/**
 * Kho đã bán (theo mặt hàng) — người bán xem SP đã giao, gồm dòng khách báo lỗi.
 */
import type { DeliveredWarehouseItem, Order } from '../ordersTypes';

const KEY = 'taphoammo_seller_sold_warehouse_v1';

export interface SellerSoldWarehouseEntry {
  id: string;
  content: string;
  time: string;
  orderId: string;
  buyerName: string;
  soldAtMs: number;
  buyerReportedDefective?: boolean;
  buyerReportedAtMs?: number;
}

function readMap(): Record<string, SellerSoldWarehouseEntry[]> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, SellerSoldWarehouseEntry[]>;
    return typeof o === 'object' && o !== null ? o : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, SellerSoldWarehouseEntry[]>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getSellerSoldWarehouseEntries(matHangId: string): SellerSoldWarehouseEntry[] {
  const id = matHangId.trim();
  if (!id) return [];
  const map = readMap();
  const rows = map[id];
  if (!Array.isArray(rows)) return [];
  return [...rows].sort((a, b) => b.soldAtMs - a.soldAtMs);
}

export function appendSellerSoldWarehouseEntries(
  matHangId: string,
  orderId: string,
  items: DeliveredWarehouseItem[],
  buyerName: string
): void {
  const pid = matHangId.trim();
  if (!pid || !orderId.trim() || items.length === 0) return;
  const map = readMap();
  const prev = map[pid] ?? [];
  const existingIds = new Set(prev.map(r => r.id));
  const soldAtMs = Date.now();
  const next: SellerSoldWarehouseEntry[] = [...prev];
  for (const item of items) {
    if (!item.id || existingIds.has(item.id)) continue;
    existingIds.add(item.id);
    next.push({
      id: item.id,
      content: item.content,
      time: item.time || new Date(soldAtMs).toLocaleString('vi-VN'),
      orderId: orderId.trim(),
      buyerName: buyerName.trim() || '—',
      soldAtMs,
      buyerReportedDefective: item.buyerReportedDefective,
      buyerReportedAtMs: item.buyerReportedAtMs,
    });
  }
  map[pid] = next;
  writeMap(map);
}

export function markSellerSoldWarehouseDefective(
  matHangId: string,
  orderId: string,
  itemIds: string[],
  reportedAtMs: number
): void {
  const pid = matHangId.trim();
  const oid = orderId.trim();
  if (!pid || !oid || itemIds.length === 0) return;
  const idSet = new Set(itemIds);
  const map = readMap();
  const prev = map[pid] ?? [];
  map[pid] = prev.map(row => {
    if (row.orderId !== oid || !idSet.has(row.id)) return row;
    return {
      ...row,
      buyerReportedDefective: true,
      buyerReportedAtMs: reportedAtMs,
    };
  });
  writeMap(map);
}

/** Đồng bộ kho đã bán từ mọi đơn có `adminMatHangId` (sửa lệch dữ liệu cũ / thiếu ghi). */
export function syncSellerSoldWarehouseFromOrders(matHangId: string, orders: Order[]): void {
  const pid = matHangId.trim();
  if (!pid) return;
  for (const o of orders) {
    if (o.adminMatHangId?.trim() !== pid || !o.deliveredItems?.length) continue;
    appendSellerSoldWarehouseEntries(pid, o.id, o.deliveredItems, o.buyerName);
    const defectiveIds = o.deliveredItems
      .filter(i => i.buyerReportedDefective)
      .map(i => i.id);
    if (defectiveIds.length > 0) {
      const reportedAtMs = Math.max(
        ...o.deliveredItems.map(i => i.buyerReportedAtMs ?? Date.now())
      );
      markSellerSoldWarehouseDefective(pid, o.id, defectiveIds, reportedAtMs);
    }
  }
}

/** Gắn cờ lỗi trên đơn + đồng bộ kho đã bán người bán. */
export function applyBuyerDefectiveReportToOrder(order: Order, itemIds: string[]): Order {
  if (!order.deliveredItems?.length || itemIds.length === 0) return order;
  const idSet = new Set(itemIds);
  const reportedAtMs = Date.now();
  const deliveredItems = order.deliveredItems.map(item => {
    if (!idSet.has(item.id) || item.buyerReportedDefective) return item;
    return {
      ...item,
      buyerReportedDefective: true,
      buyerReportedAtMs: reportedAtMs,
    };
  });
  if (order.adminMatHangId) {
    markSellerSoldWarehouseDefective(order.adminMatHangId, order.id, itemIds, reportedAtMs);
    appendSellerSoldWarehouseEntries(
      order.adminMatHangId,
      order.id,
      deliveredItems.filter(i => idSet.has(i.id)),
      order.buyerName
    );
  }
  return { ...order, deliveredItems };
}
