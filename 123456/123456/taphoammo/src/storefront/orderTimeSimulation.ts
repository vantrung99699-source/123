import type { Order } from '../ordersTypes';

export const ORDER_TIMER_THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function getOrderSimulatedAdvanceMs(order: Order): number {
  return order.simulatedTimeAdvanceMs ?? order.escrowSimulatedAdvanceMs ?? 0;
}

export function getOrderEffectiveNowMs(order: Order, realNowMs = Date.now()): number {
  return realNowMs + getOrderSimulatedAdvanceMs(order);
}

/** Cộng ms mô phỏng — dùng cho nút +3 ngày và kiểm thử hẹn giờ. */
export function advanceOrderSimulatedTimeMs(order: Order, advanceMs: number): Partial<Order> {
  const prev = getOrderSimulatedAdvanceMs(order);
  return { simulatedTimeAdvanceMs: prev + advanceMs };
}

/** Cộng 3 ngày mô phỏng — dùng cho mọi luồng hẹn giờ (tạm giữ, tranh chấp, …). */
export function advanceOrderSimulatedTimeThreeDays(order: Order): Partial<Order> {
  return advanceOrderSimulatedTimeMs(order, ORDER_TIMER_THREE_DAYS_MS);
}

export function formatTimerRemainingDays(
  startedAtMs: number,
  order: Order,
  realNowMs = Date.now()
): string | null {
  const effectiveNow = getOrderEffectiveNowMs(order, realNowMs);
  const remaining = ORDER_TIMER_THREE_DAYS_MS - (effectiveNow - startedAtMs);
  if (remaining <= 0) return 'Sẵn sàng xử lý';
  const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
  return `Còn ~${days} ngày`;
}
