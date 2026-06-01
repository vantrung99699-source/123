/** Types dùng chung admin phê duyệt gian hàng — khớp cấu trúc `Category` trong App.tsx */

export type GianHangStatus = 'Đang bán' | 'Tạm ngưng' | 'Chờ duyệt' | 'Đã hủy';
export type GianHangBusinessLine = 'Bán sản phẩm' | 'Dịch vụ';

export interface GianHangProduct {
  id: string;
  name: string;
  price: string;
  status: GianHangStatus;
  active?: boolean;
  date?: string;
}

export interface GianHangCategory {
  id: string;
  name: string;
  isParent?: boolean;
  platform?: string;
  date?: string;
  status?: GianHangStatus;
  businessLine?: GianHangBusinessLine;
  classification?: {
    businessType?: string;
    category?: string;
    product?: string;
  };
  sellerDisplayName?: string;
  createdByName?: string;
  products?: GianHangProduct[];
  subCategories?: GianHangCategory[];
}

export function effectiveGianHangStatus(cat: GianHangCategory): GianHangStatus {
  return cat.status ?? 'Đang bán';
}

export function resolveGianHangBusinessLineLabel(cat: GianHangCategory): GianHangBusinessLine | null {
  const bt = cat.classification?.businessType?.trim();
  if (bt === 'Bán sản phẩm' || bt === 'Dịch vụ') return bt;
  if (cat.businessLine === 'Bán sản phẩm' || cat.businessLine === 'Dịch vụ') return cat.businessLine;
  return null;
}

export function flattenGianHangLeaves(nodes: GianHangCategory[]): GianHangCategory[] {
  const out: GianHangCategory[] = [];
  const walk = (list: GianHangCategory[]) => {
    for (const n of list) {
      if (n.isParent) {
        if (n.subCategories?.length) walk(n.subCategories);
      } else {
        out.push(n);
        if (n.subCategories?.length) walk(n.subCategories);
      }
    }
  };
  walk(nodes);
  return out;
}

export function countGianHangPendingApproval(categories: GianHangCategory[]): number {
  let count = 0;
  const walk = (nodes: GianHangCategory[]) => {
    for (const node of nodes) {
      if (!node.isParent && effectiveGianHangStatus(node) === 'Chờ duyệt') count += 1;
      for (const p of node.products ?? []) {
        if (p.status === 'Chờ duyệt') count += 1;
      }
      if (node.subCategories?.length) walk(node.subCategories);
    }
  };
  walk(categories);
  return count;
}

export type GianHangApprovalRow =
  | {
      kind: 'store';
      id: string;
      storeName: string;
      platform?: string;
      businessLine: GianHangBusinessLine | null;
      productType?: string;
      sellerName: string;
      date?: string;
      status: GianHangStatus;
    }
  | {
      kind: 'product';
      id: string;
      storeId: string;
      storeName: string;
      productName: string;
      price: string;
      platform?: string;
      businessLine: GianHangBusinessLine | null;
      sellerName: string;
      date?: string;
      status: GianHangStatus;
    };

export function buildGianHangApprovalRows(
  categories: GianHangCategory[],
  statusFilter: 'Chờ duyệt' | 'Đã duyệt' | 'Tất cả'
): GianHangApprovalRow[] {
  const rows: GianHangApprovalRow[] = [];
  const leaves = flattenGianHangLeaves(categories);

  const matchesFilter = (status: GianHangStatus) => {
    if (statusFilter === 'Tất cả') return true;
    if (statusFilter === 'Chờ duyệt') return status === 'Chờ duyệt';
    return status === 'Đang bán' || status === 'Tạm ngưng';
  };

  for (const store of leaves) {
    const storeStatus = effectiveGianHangStatus(store);
    const sellerName =
      store.sellerDisplayName?.trim() || store.createdByName?.trim() || '—';
    const businessLine = resolveGianHangBusinessLineLabel(store);
    const productType =
      store.classification?.product?.split(' (')[0] || store.platform;

    if (matchesFilter(storeStatus)) {
      rows.push({
        kind: 'store',
        id: store.id,
        storeName: store.name,
        platform: store.platform,
        businessLine,
        productType,
        sellerName,
        date: store.date,
        status: storeStatus,
      });
    }

    for (const p of store.products ?? []) {
      if (!matchesFilter(p.status)) continue;
      rows.push({
        kind: 'product',
        id: p.id,
        storeId: store.id,
        storeName: store.name,
        productName: p.name,
        price: p.price,
        platform: store.platform,
        businessLine,
        sellerName,
        date: p.date ?? store.date,
        status: p.status,
      });
    }
  }

  return rows.sort((a, b) => {
    if (a.status === 'Chờ duyệt' && b.status !== 'Chờ duyệt') return -1;
    if (b.status === 'Chờ duyệt' && a.status !== 'Chờ duyệt') return 1;
    const dateA = a.date ?? '';
    const dateB = b.date ?? '';
    return dateB.localeCompare(dateA, 'vi');
  });
}
