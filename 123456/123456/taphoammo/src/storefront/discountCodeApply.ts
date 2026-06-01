import {
  normalizeDiscountCodeRow,
  readDiscountCodesFromStorage,
  writeDiscountCodesToStorage,
  type DiscountCodeRow,
} from '../admin/discountCodesStorage';

function parseVndFromDisplayLabel(label: string): number | null {
  if (!label?.trim() || label.includes('Không giới hạn') || label === '—') return null;
  const digits = label.replace(/\D/g, '');
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function displayDateToIso(display: string): string | undefined {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(display.trim());
  if (!m) return undefined;
  const d = m[1].padStart(2, '0');
  const mo = m[2].padStart(2, '0');
  return `${m[3]}-${mo}-${d}`;
}

/** Tiền giảm từ mã (trên tổng sau ưu đãi niêm yết). */
export function computeDiscountCodeOffVnd(saleTotalVnd: number, row: DiscountCodeRow): number {
  if (saleTotalVnd <= 0) return 0;
  const normalized = normalizeDiscountCodeRow(row);
  if (normalized.discountType === 'fixed') {
    const fixed =
      normalized.fixedAmountVnd ?? parseVndFromDisplayLabel(normalized.value) ?? 0;
    return Math.min(Math.max(0, fixed), saleTotalVnd);
  }
  const pct =
    normalized.percentValue ??
    parseFloat(normalized.value.replace('%', '').replace(',', '.')) ??
    0;
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  let off = Math.round((saleTotalVnd * Math.min(pct, 100)) / 100);
  const cap =
    normalized.maxDiscountVnd !== undefined && normalized.maxDiscountVnd !== null
      ? normalized.maxDiscountVnd
      : parseVndFromDisplayLabel(normalized.maxDiscount);
  if (cap != null && cap > 0) off = Math.min(off, cap);
  return Math.min(Math.max(0, off), saleTotalVnd);
}

export function formatAppliedDiscountLabel(row: DiscountCodeRow): string {
  const n = normalizeDiscountCodeRow(row);
  if (n.discountType === 'fixed') {
    return `Mã ${n.code}: giảm ${n.value}`;
  }
  const cap =
    n.maxDiscountVnd != null && n.maxDiscountVnd > 0
      ? `, tối đa ${n.maxDiscountVnd.toLocaleString('vi-VN')}đ`
      : n.maxDiscount === 'Không giới hạn'
        ? ', không giới hạn trần'
        : n.maxDiscount
          ? `, tối đa ${n.maxDiscount}`
          : '';
  return `Mã ${n.code}: giảm ${n.value}${cap}`;
}

export function validateDiscountCodeForCheckout(
  inputCode: string,
  gianHangName: string,
  codes: DiscountCodeRow[] = readDiscountCodesFromStorage()
): { ok: true; row: DiscountCodeRow } | { ok: false; message: string } {
  const code = inputCode.trim().toUpperCase();
  if (!code) return { ok: false, message: 'Nhập mã giảm giá' };

  const raw = codes.find((c) => c.code.toUpperCase() === code);
  if (!raw) return { ok: false, message: 'Mã giảm giá không tồn tại hoặc đã bị xóa' };

  const row = normalizeDiscountCodeRow(raw);
  if (!row.active || row.status === 'Tạm ngưng') {
    return { ok: false, message: 'Mã giảm giá đang tạm ngưng' };
  }

  const gian = gianHangName.trim();
  if (
    row.scopeStore !== 'Tất cả gian hàng' &&
    row.scopeStore.trim() !== gian
  ) {
    return { ok: false, message: `Mã chỉ áp dụng cho gian «${row.scopeStore}»` };
  }

  const today = todayIsoDate();
  const startIso = row.startDateIso ?? displayDateToIso(row.time.start);
  if (startIso && today < startIso) {
    return { ok: false, message: 'Mã chưa đến ngày bắt đầu áp dụng' };
  }
  if (!row.unlimitedEnd) {
    const endIso = row.endDateIso ?? displayDateToIso(row.time.end);
    if (endIso && today > endIso) {
      return { ok: false, message: 'Mã giảm giá đã hết hạn' };
    }
  }

  const used = row.usedCount ?? 0;
  if (!row.unlimitedUsage && row.maxUsageCount != null && used >= row.maxUsageCount) {
    return { ok: false, message: 'Mã đã hết lượt sử dụng' };
  }

  return { ok: true, row };
}

export function incrementDiscountCodeUsage(codeId: string): void {
  const codes = readDiscountCodesFromStorage();
  const next = codes.map((c) => {
    if (c.id !== codeId) return c;
    const normalized = normalizeDiscountCodeRow(c);
    const used = (normalized.usedCount ?? 0) + 1;
    const unlimited = normalized.unlimitedUsage ?? false;
    const max = normalized.maxUsageCount;
    const usage = unlimited ? `${used}/∞` : `${used}/${max ?? '?'}`;
    return { ...normalized, usedCount: used, usage };
  });
  writeDiscountCodesToStorage(next);
}
