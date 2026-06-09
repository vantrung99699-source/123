import type { Order } from './ordersTypes';

export function parsePriceToVndNumber(priceStr: string): number {
  let cleaned = priceStr.trim().replace(/\s/g, '').replace(/đ/gi, '').replace(/'/g, '');
  if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '');
  } else if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) {
    cleaned = cleaned.replace(/,/g, '');
  }
  const digits = cleaned.replace(/[^\d]/g, '');
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? 0 : n;
}

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

/** Tổng từ đơn giá × SL − giảm giá (đối chiếu với totalAmount đã lưu). */
export function getOrderLineTotalVnd(order: Order): number {
  const qty = Math.max(1, order.quantity);
  const unit = parsePriceToVndNumber(order.unitPrice);
  const discount = parsePriceToVndNumber(order.discount || '0');
  return Math.max(0, unit * qty - discount);
}

/** Số tiền đơn — ưu tiên max(totalAmount, dòng tính) để tránh totalAmount lưu sai. */
export function getOrderTotalAmountVnd(order: Order): number {
  const fromLines = getOrderLineTotalVnd(order);
  if (order.totalAmount === 'Chưa thanh toán' || !order.totalAmount?.trim()) {
    return fromLines;
  }
  const fromTotal = parsePriceToVndNumber(order.totalAmount);
  return Math.max(fromTotal, fromLines);
}

export function formatOrderTotalDisplay(order: Order): string {
  return formatVnd(getOrderTotalAmountVnd(order));
}
