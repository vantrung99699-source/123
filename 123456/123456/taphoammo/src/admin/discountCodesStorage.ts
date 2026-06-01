export interface DiscountCodeRow {
  id: string;
  code: string;
  scopeStore: string;
  value: string;
  maxDiscount: string;
  time: { start: string; end: string };
  usage: string;
  status: 'Hoạt động' | 'Tạm ngưng';
  active: boolean;
  /** Dữ liệu tính giảm khi mua hàng storefront */
  discountType?: 'percent' | 'fixed';
  percentValue?: number;
  fixedAmountVnd?: number;
  /** null = không giới hạn trần (%) */
  maxDiscountVnd?: number | null;
  unlimitedUsage?: boolean;
  maxUsageCount?: number;
  usedCount?: number;
  unlimitedEnd?: boolean;
  startDateIso?: string;
  endDateIso?: string;
}

export const DISCOUNT_CODES_STORAGE_KEY = 'taphoammo_discount_codes_v1';

function isDiscountCodeRow(row: unknown): row is DiscountCodeRow {
  if (!row || typeof row !== 'object') return false;
  const r = row as DiscountCodeRow;
  return (
    typeof r.id === 'string' &&
    typeof r.code === 'string' &&
    typeof r.scopeStore === 'string' &&
    typeof r.value === 'string' &&
    typeof r.maxDiscount === 'string' &&
    typeof r.usage === 'string' &&
    (r.status === 'Hoạt động' || r.status === 'Tạm ngưng') &&
    typeof r.active === 'boolean' &&
    r.time != null &&
    typeof r.time.start === 'string' &&
    typeof r.time.end === 'string'
  );
}

export function readDiscountCodesFromStorage(): DiscountCodeRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DISCOUNT_CODES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDiscountCodeRow).map(normalizeDiscountCodeRow);
  } catch {
    return [];
  }
}

function parseVndFromDisplayLabel(label: string): number | null {
  if (!label?.trim() || label.includes('Không giới hạn') || label === '—') return null;
  const digits = label.replace(/\D/g, '');
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Bổ sung field tính toán cho mã lưu trước khi có discountType. */
export function normalizeDiscountCodeRow(row: DiscountCodeRow): DiscountCodeRow {
  if (row.discountType) {
    return {
      ...row,
      usedCount: row.usedCount ?? 0,
      unlimitedUsage: row.unlimitedUsage ?? row.usage.includes('∞'),
      unlimitedEnd: row.unlimitedEnd ?? row.time.end === 'Không hạn',
    };
  }
  const isPercent = row.value.trim().endsWith('%');
  const percentValue = isPercent ? parseFloat(row.value.replace('%', '').replace(',', '.')) : undefined;
  const fixedAmountVnd = !isPercent ? parseVndFromDisplayLabel(row.value) ?? undefined : undefined;
  const maxDiscountVnd = isPercent ? parseVndFromDisplayLabel(row.maxDiscount) : null;
  const usageParts = row.usage.split('/');
  const usedCount = parseInt(usageParts[0]?.trim() || '0', 10) || 0;
  const maxPart = usageParts[1]?.trim();
  const unlimitedUsage = maxPart === '∞' || row.usage.includes('∞');
  const maxUsageCount =
    !unlimitedUsage && maxPart && maxPart !== '∞' ? parseInt(maxPart, 10) || undefined : undefined;
  return {
    ...row,
    discountType: isPercent ? 'percent' : 'fixed',
    percentValue: Number.isFinite(percentValue) ? percentValue : undefined,
    fixedAmountVnd,
    maxDiscountVnd: isPercent ? maxDiscountVnd : null,
    unlimitedUsage,
    maxUsageCount,
    usedCount,
    unlimitedEnd: row.time.end === 'Không hạn',
    startDateIso: row.startDateIso,
    endDateIso: row.endDateIso,
  };
}

export function writeDiscountCodesToStorage(codes: DiscountCodeRow[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DISCOUNT_CODES_STORAGE_KEY, JSON.stringify(codes));
  } catch {
    /* ignore */
  }
}
