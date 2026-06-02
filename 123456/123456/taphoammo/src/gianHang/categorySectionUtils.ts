import type { BusinessLine, Category, Product, Status } from './types';

/** Người bán không được dùng Bật/Tắt khi admin đã khóa hoặc đóng mặt hàng. */
export function isProductSellerToggleLocked(product: Product): boolean {
  return product.status === 'Đóng' || product.sellerToggleLocked === true;
}

export function categoryDisplayOrderTimestamp(c: Category): number {
  if (typeof c.createdAt === 'number' && c.createdAt > 0) return c.createdAt;
  const d = c.date?.trim();
  if (!d) return 0;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(d);
  if (!m) return 0;
  return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10)).getTime();
}

export function formatGianHangDisplayDate(date?: string): string {
  if (!date?.trim()) return '';
  const t = date.trim();
  if (/\d{1,2}:\d{2}/.test(t)) return t;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (m) return `${t} 00:00`;
  return t;
}

export function effectiveGianHangStatus(category: Category): Status {
  return category.status ?? 'Đang bán';
}

export function normalizeAdminStatusTab(activeTab?: string): Status | 'Tất cả' {
  if (!activeTab || activeTab === 'Tất cả') return 'Tất cả';
  if (activeTab.startsWith('Chờ duyệt')) return 'Chờ duyệt';
  return activeTab as Status;
}

export function matchesAdminStatusTab(entityStatus: Status, activeTab?: string): boolean {
  const tab = normalizeAdminStatusTab(activeTab);
  if (tab === 'Tất cả') return true;
  return entityStatus === tab;
}

/** Tên danh mục hiển thị — khớp Quản lý danh mục / menu storefront (không dùng tên nền tảng cha). */
export function resolveGianHangDanhMucLabel(category: Category): string {
  const fromClassification = category.classification?.category?.trim();
  if (fromClassification) return fromClassification;
  return category.platform?.trim() || '—';
}

export function resolveGianHangBusinessLine(
  category: Category,
  parentBusinessLine?: BusinessLine
): BusinessLine | null {
  const bt = category.classification?.businessType?.trim();
  if (bt === 'Bán sản phẩm' || bt === 'Dịch vụ') return bt;
  if (category.businessLine === 'Bán sản phẩm' || category.businessLine === 'Dịch vụ') {
    return category.businessLine;
  }
  if (parentBusinessLine) return parentBusinessLine;
  return null;
}

export const RESELLER_PERCENT_DEFAULT = 5;

export function parseResellerPercentInput(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return RESELLER_PERCENT_DEFAULT;
  const n = parseFloat(trimmed.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return RESELLER_PERCENT_DEFAULT;
  return Math.min(n, 100);
}

export function isGianHangResellerEnabled(category: Category): boolean {
  if (category.configuration?.isReseller === true) return true;
  return category.tags?.some(t => t.toUpperCase() === 'RESELLER') ?? false;
}

/** % chiết khấu reseller hiển thị trên gian — `null` nếu không bật reseller. */
export function getGianHangResellerPercent(category: Category): number | null {
  if (!isGianHangResellerEnabled(category)) return null;
  const configured = category.configuration?.resellerDefaultPercent;
  if (typeof configured === 'number' && Number.isFinite(configured) && configured >= 0) {
    return Math.min(configured, 100);
  }
  return RESELLER_PERCENT_DEFAULT;
}

/** Gian hàng con (không phải danh mục cha) — dùng dropdown admin (mã giảm giá, …). */
export function flattenGianHangLeaves(categories: Category[]): Category[] {
  const leaves: Category[] = [];
  for (const parent of categories) {
    if (!parent.isParent) continue;
    for (const sub of parent.subCategories || []) {
      if (!sub.isParent) leaves.push(sub);
    }
  }
  return [...leaves].sort((a, b) => {
    const tb = categoryDisplayOrderTimestamp(b);
    const ta = categoryDisplayOrderTimestamp(a);
    if (tb !== ta) return tb - ta;
    return a.name.localeCompare(b.name, 'vi');
  });
}

export function buildGianHangSelectOptions(
  categories: Category[],
  includeAllOption = true
): { value: string; label: string }[] {
  const leaves = flattenGianHangLeaves(categories);
  const perGian = leaves.map(g => ({ value: g.name, label: g.name }));
  if (includeAllOption) {
    return [{ value: 'Tất cả gian hàng', label: 'Tất cả gian hàng' }, ...perGian];
  }
  return perGian;
}

export function countGianHangPendingApproval(categories: Category[]): number {
  let count = 0;
  const walk = (nodes: Category[]) => {
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
