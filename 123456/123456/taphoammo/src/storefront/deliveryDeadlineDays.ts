/** Hạn giao tối đa (ngày) — khách chọn lúc đặt trước / mặc định đơn dịch vụ. */
export const DELIVERY_DEADLINE_DAYS_DEFAULT = 7;
export const DELIVERY_DEADLINE_DAYS_MIN = 1;
export const DELIVERY_DEADLINE_DAYS_MAX = 30;

export function clampDeliveryDeadlineDays(value: number): number {
  if (!Number.isFinite(value)) return DELIVERY_DEADLINE_DAYS_DEFAULT;
  return Math.min(
    DELIVERY_DEADLINE_DAYS_MAX,
    Math.max(DELIVERY_DEADLINE_DAYS_MIN, Math.round(value))
  );
}

export function parseDeliveryDeadlineDaysInput(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === '') return DELIVERY_DEADLINE_DAYS_DEFAULT;
  const n = parseInt(trimmed, 10);
  if (Number.isNaN(n)) return DELIVERY_DEADLINE_DAYS_DEFAULT;
  return clampDeliveryDeadlineDays(n);
}

export const DAY_MS = 24 * 60 * 60 * 1000;
