import { isPreOrderAwaitingFulfillment } from '../orderStatusBadge';
import {
  orderNewestSortKey,
  parsePurchaseDateToMs,
  type Order,
} from '../ordersTypes';
import {
  ORDER_TIMER_THREE_DAYS_MS,
  advanceOrderSimulatedTimeThreeDays,
  formatTimerRemainingDays,
  getOrderEffectiveNowMs,
  getOrderSimulatedAdvanceMs,
} from './orderTimeSimulation';

/** @deprecated Dùng ORDER_TIMER_THREE_DAYS_MS */
export const ESCROW_AUTO_COMPLETE_MS = ORDER_TIMER_THREE_DAYS_MS;

export function getEscrowHoldStartMs(order: Order): number {
  if (typeof order.escrowHoldStartedAtMs === 'number' && !Number.isNaN(order.escrowHoldStartedAtMs)) {
    return order.escrowHoldStartedAtMs;
  }
  if (typeof order.createdAtMs === 'number' && !Number.isNaN(order.createdAtMs)) {
    return order.createdAtMs;
  }
  const fromDate = parsePurchaseDateToMs(order.purchaseDate);
  if (fromDate != null) return fromDate;
  return orderNewestSortKey(order);
}

/** @deprecated Dùng getOrderEffectiveNowMs */
export function getEscrowEffectiveNowMs(order: Order, realNowMs = Date.now()): number {
  return getOrderEffectiveNowMs(order, realNowMs);
}

/**
 * Đơn đang tạm giữ ví — sau 3 ngày → Hoàn thành.
 * Đặt trước chờ shop giao: không dùng hẹn 3 ngày ví — dùng `preOrderAutoFail` (7 ngày).
 * `hasComplained` chỉ chặn gửi khiếu nại lần 2; sau khi hủy K/N và về Tạm giữ vẫn được giải ngân.
 */
export function isEscrowAutoCompleteCandidate(order: Order): boolean {
  if (isPreOrderAwaitingFulfillment(order)) return false;
  return order.status === 'Tạm giữ tiền';
}

/** Ms cần cộng mô phỏng để hết hạn tạm giữ 3 ngày (nút +3 ngày). */
export function getEscrowTestFastForwardAdvanceMs(order: Order, realNowMs = Date.now()): number | null {
  if (!isEscrowAutoCompleteCandidate(order)) return null;
  const heldAt = getEscrowHoldStartMs(order);
  const effectiveNow = getOrderEffectiveNowMs(order, realNowMs);
  const remaining = ORDER_TIMER_THREE_DAYS_MS - (effectiveNow - heldAt);
  if (remaining <= 0) return ORDER_TIMER_THREE_DAYS_MS;
  return Math.max(ORDER_TIMER_THREE_DAYS_MS, remaining + 1);
}

export function shouldAutoCompleteEscrowNow(order: Order, realNowMs = Date.now()): boolean {
  if (!isEscrowAutoCompleteCandidate(order)) return false;
  const heldAt = getEscrowHoldStartMs(order);
  const effectiveNow = getOrderEffectiveNowMs(order, realNowMs);
  return effectiveNow - heldAt >= ORDER_TIMER_THREE_DAYS_MS;
}

export function getEscrowAutoCompletePatch(order: Order, realNowMs = Date.now()): Partial<Order> | null {
  if (!shouldAutoCompleteEscrowNow(order, realNowMs)) return null;
  return { status: 'Hoàn thành' };
}

/** @deprecated Dùng advanceOrderSimulatedTimeThreeDays */
export function advanceEscrowByThreeDays(order: Order): Partial<Order> {
  return advanceOrderSimulatedTimeThreeDays(order);
}

/** Áp dụng auto-complete lên một đơn (sau fast-forward hoặc tick định kỳ). */
export function applyEscrowAutoCompleteToOrder(order: Order, realNowMs = Date.now()): Order {
  const patch = getEscrowAutoCompletePatch(order, realNowMs);
  return patch ? { ...order, ...patch } : order;
}

/** @deprecated Dùng processAllOrderTimers */
export function processEscrowAutoComplete(orders: Order[], realNowMs = Date.now()): Order[] {
  let changed = false;
  const next = orders.map(o => {
    const updated = applyEscrowAutoCompleteToOrder(o, realNowMs);
    if (updated !== o) changed = true;
    return updated;
  });
  return changed ? next : orders;
}

/** @deprecated Dùng fastForwardOrderTimeThreeDays */
export function fastForwardEscrowThreeDays(order: Order, realNowMs = Date.now()): Order {
  const advanced = { ...order, ...advanceOrderSimulatedTimeThreeDays(order) };
  return applyEscrowAutoCompleteToOrder(advanced, realNowMs);
}

export function formatEscrowRemainingLabel(order: Order, realNowMs = Date.now()): string | null {
  if (!isEscrowAutoCompleteCandidate(order)) return null;
  const hint = formatTimerRemainingDays(getEscrowHoldStartMs(order), order, realNowMs);
  if (!hint) return null;
  if (hint === 'Sẵn sàng xử lý') return 'Ví tạm giữ 3 ngày — sẵn Hoàn thành';
  return `Ví tạm giữ 3 ngày — ${hint}`;
}

export { getOrderSimulatedAdvanceMs };
