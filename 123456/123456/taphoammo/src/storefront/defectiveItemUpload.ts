import type { Order } from '../ordersTypes';
import {
  applyBuyerDefectiveReportToOrder,
  syncSellerSoldWarehouseFromOrders,
} from './sellerSoldWarehouse';

export interface DefectiveUploadLine {
  uid: string;
  content?: string;
}

/** Mỗi dòng: UID hoặc UID|nội dung hoặc UID<Tab>nội dung — chỉ áp dụng khi UID trùng đơn. */
export function parseDefectiveUploadText(
  text: string,
  knownUids: Set<string>
): DefectiveUploadLine[] {
  const seen = new Set<string>();
  const out: DefectiveUploadLine[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    let uid = '';
    let content: string | undefined;

    const pipeIdx = line.indexOf('|');
    const tabIdx = line.indexOf('\t');

    if (pipeIdx > 0) {
      uid = line.slice(0, pipeIdx).trim();
      const rest = line.slice(pipeIdx + 1).trim();
      content = rest || undefined;
    } else if (tabIdx > 0) {
      uid = line.slice(0, tabIdx).trim();
      const rest = line.slice(tabIdx + 1).trim();
      content = rest || undefined;
    } else if (knownUids.has(line)) {
      uid = line;
    } else {
      const first = line.split(/\s+/)[0]?.trim();
      if (first && knownUids.has(first)) {
        uid = first;
        const rest = line.slice(first.length).trim();
        content = rest || undefined;
      } else {
        continue;
      }
    }

    if (!uid || !knownUids.has(uid) || seen.has(uid)) continue;
    seen.add(uid);
    out.push({ uid, content });
  }

  return out;
}

export function applyDefectiveUploadToOrder(
  order: Order,
  lines: DefectiveUploadLine[]
): Order {
  if (!order.deliveredItems?.length || lines.length === 0) return order;

  const lineMap = new Map(lines.map(l => [l.uid, l]));
  const itemIds = lines.map(l => l.uid);

  let next = applyBuyerDefectiveReportToOrder(order, itemIds);

  const deliveredItems = next.deliveredItems?.map(item => {
    const patch = lineMap.get(item.id);
    if (!patch?.content) return item;
    return { ...item, content: patch.content };
  });

  const updated = deliveredItems ? { ...next, deliveredItems } : next;
  if (updated.adminMatHangId) {
    syncSellerSoldWarehouseFromOrders(updated.adminMatHangId, [updated]);
  }
  return updated;
}
