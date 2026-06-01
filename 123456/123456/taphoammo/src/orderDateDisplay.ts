import type { Order } from './ordersTypes';
import { getComplaintStartedAtMs } from './storefront/complaintAutoFail';
import { getDisputeStartedAtMs } from './storefront/disputeAutoRefund';

/** `DD/MM/YYYY HH:mm` — cùng định dạng ngày mua trên đơn. */
export function formatOrderDateTimeMs(ms: number): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface ComplaintEventDisplay {
  kind: 'Khiếu nại' | 'Tranh chấp';
  formatted: string;
  /** Có `complaintStartedAtMs` / `disputeStartedAtMs` ghi thật — không phải suy từ ngày mua. */
  isExactTimestamp: boolean;
}

export function getComplaintEventDisplay(order: Order): ComplaintEventDisplay {
  if (order.status === 'Tranh chấp') {
    const exact = typeof order.disputeStartedAtMs === 'number' && !Number.isNaN(order.disputeStartedAtMs);
    const atMs = getDisputeStartedAtMs(order);
    return {
      kind: 'Tranh chấp',
      formatted: formatOrderDateTimeMs(atMs),
      isExactTimestamp: exact,
    };
  }
  const exact = typeof order.complaintStartedAtMs === 'number' && !Number.isNaN(order.complaintStartedAtMs);
  const atMs = getComplaintStartedAtMs(order);
  return {
    kind: 'Khiếu nại',
    formatted: formatOrderDateTimeMs(atMs),
    isExactTimestamp: exact,
  };
}
