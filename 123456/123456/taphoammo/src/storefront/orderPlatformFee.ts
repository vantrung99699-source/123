import type { Order } from '../ordersTypes';
import { getOrderFeeBasisTotalVnd } from '../orderRefund';
import { formatVnd, parsePriceToVndNumber } from '../orderAmountDisplay';
import {
  parsePlatformFeePercent,
  parseProductTypeLabel,
} from '../gianHang/productTypeClassification';

export const PLATFORM_FEE_PERCENT_DEFAULT = 5;

/** % phí sàn từ nhãn loại SP/DV admin — không có (N%) thì mặc định 5%. */
export function resolvePlatformFeePercentFromProductTypeLabel(productTypeRaw: string): number {
  const parsed = parseProductTypeLabel(productTypeRaw.trim());
  if (parsed.platformFeePercent > 0) return parsed.platformFeePercent;
  return parsePlatformFeePercent('');
}

export function effectivePlatformFeePercent(percent?: number): number {
  if (typeof percent === 'number' && Number.isFinite(percent) && percent >= 0) {
    return Math.min(percent, 100);
  }
  return PLATFORM_FEE_PERCENT_DEFAULT;
}

export function computePlatformFeeVnd(totalVnd: number, percent: number): number {
  if (totalVnd <= 0 || percent <= 0) return 0;
  const raw = (totalVnd * Math.min(percent, 100)) / 100;
  if (raw <= 0) return 0;
  const rounded = Math.round(raw);
  return rounded > 0 ? rounded : 1;
}

export function buildPlatformFeeFieldsForCheckout(
  totalVnd: number,
  platformFeePercent: number
): Pick<Order, 'platformFee' | 'platformFeePercent'> {
  const pct = effectivePlatformFeePercent(platformFeePercent);
  const feeVnd = computePlatformFeeVnd(totalVnd, pct);
  return {
    platformFeePercent: pct,
    platformFee: feeVnd > 0 ? formatVnd(feeVnd) : '0đ',
  };
}

/** Số tiền phí sàn thực tế — tính từ % + tổng đơn; fallback `platformFee` đã lưu. */
export function getOrderPlatformFeeVnd(order: Order): number {
  const stored = parsePriceToVndNumber(order.platformFee || '0');
  if (order.checkoutPaid || order.platformFeePercent != null) {
    const pct = effectivePlatformFeePercent(order.platformFeePercent);
    const computed = computePlatformFeeVnd(getOrderFeeBasisTotalVnd(order), pct);
    return computed > 0 ? computed : stored;
  }
  return stored;
}

/** Hiển thị cột Sàn — chỉ số tiền, không kèm % phí sàn. */
export function formatOrderPlatformFeeDisplay(order: Order): string {
  const vnd = getOrderPlatformFeeVnd(order);
  return vnd > 0 ? formatVnd(vnd) : '0đ';
}
