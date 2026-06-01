import type { Order } from '../ordersTypes';
import { isPreOrderAwaitingFulfillment } from '../orderStatusBadge';
import { applyComplaintAutoFailToOrder } from './complaintAutoFail';
import { DAY_MS } from './deliveryDeadlineDays';
import { applyDisputeAutoRefundToOrder } from './disputeAutoRefund';
import { applyEscrowAutoCompleteToOrder } from './escrowAutoComplete';
import {
  applyPreOrderAutoFailToOrder,
  formatPreOrderDeadlineRemainingLabel,
  getPreOrderDeadlineMs,
} from './preOrderAutoFail';
import {
  applyServiceOrderAutoFailToOrder,
  formatServiceDeadlineRemainingLabel,
  getServiceDeadlineMs,
  isServiceAwaitingDelivery,
  isServiceAwaitingSellerConfirm,
} from './serviceOrderAutoFail';
import {
  ORDER_TIMER_THREE_DAYS_MS,
  getOrderEffectiveNowMs,
  getOrderSimulatedAdvanceMs,
} from './orderTimeSimulation';
import { formatComplaintFailRemainingLabel } from './complaintAutoFail';
import { formatDisputeRefundRemainingLabel } from './disputeAutoRefund';
import {
  formatEscrowRemainingLabel,
  getEscrowTestFastForwardAdvanceMs,
} from './escrowAutoComplete';
export function applyAllOrderTimerRules(order: Order, realNowMs = Date.now()): Order {
  let o = applyPreOrderAutoFailToOrder(order, realNowMs);
  o = applyServiceOrderAutoFailToOrder(o, realNowMs);
  o = applyEscrowAutoCompleteToOrder(o, realNowMs);
  o = applyComplaintAutoFailToOrder(o, realNowMs);
  o = applyDisputeAutoRefundToOrder(o, realNowMs);
  return o;
}

export function processAllOrderTimers(orders: Order[], realNowMs = Date.now()): Order[] {
  let changed = false;
  const next = orders.map(o => {
    const updated = applyAllOrderTimerRules(o, realNowMs);
    if (updated !== o) changed = true;
    return updated;
  });
  return changed ? next : orders;
}

/** Ms cộng mô phỏng khi bấm +3 ngày (đặt trước / DV theo hạn riêng; còn lại tạm giữ ví 3 ngày). */
export function getTestFastForwardAdvanceMs(order: Order, realNowMs = Date.now()): number {
  if (isPreOrderAwaitingFulfillment(order)) {
    const deadline = getPreOrderDeadlineMs(order);
    if (deadline != null) {
      const remaining = deadline - getOrderEffectiveNowMs(order, realNowMs);
      if (remaining > 0) return ORDER_TIMER_THREE_DAYS_MS;
    }
  }
  if (isServiceAwaitingSellerConfirm(order) || isServiceAwaitingDelivery(order)) {
    const phase = isServiceAwaitingDelivery(order) ? 'deliver' : 'confirm';
    const deadline = getServiceDeadlineMs(order, phase);
    const remaining = deadline - getOrderEffectiveNowMs(order, realNowMs);
    if (remaining > 0) return Math.max(ORDER_TIMER_THREE_DAYS_MS, remaining + DAY_MS);
  }
  const escrowAdvance = getEscrowTestFastForwardAdvanceMs(order, realNowMs);
  if (escrowAdvance != null) return escrowAdvance;
  return ORDER_TIMER_THREE_DAYS_MS;
}

/** Nút kiểm thử +3 ngày: cộng mô phỏng rồi áp dụng mọi luồng hẹn giờ. */
export function fastForwardOrderTimeThreeDays(order: Order, realNowMs = Date.now()): Order {
  const advanceMs = getTestFastForwardAdvanceMs(order, realNowMs);
  const prev = getOrderSimulatedAdvanceMs(order);
  let advanced = { ...order, simulatedTimeAdvanceMs: prev + advanceMs };
  return applyAllOrderTimerRules(advanced, realNowMs);
}

export function formatOrderTimerHint(order: Order, realNowMs = Date.now()): string | null {
  const preOrder = formatPreOrderDeadlineRemainingLabel(order, realNowMs);
  if (preOrder) return preOrder;
  const service = formatServiceDeadlineRemainingLabel(order, realNowMs);
  if (service) return service;
  const complaint = formatComplaintFailRemainingLabel(order, realNowMs);
  if (complaint) return complaint;
  const dispute = formatDisputeRefundRemainingLabel(order, realNowMs);
  if (dispute) return dispute;
  return formatEscrowRemainingLabel(order, realNowMs);
}

export { getOrderEffectiveNowMs };

/** Thông báo sau nút +3 ngày (khi trạng thái không đổi). */
export function getFastForwardResultMessage(before: Order, after: Order): string {
  if (before.status !== after.status) {
    return `Đã cập nhật: ${before.status} → ${after.status}`;
  }
  const advanced = getOrderSimulatedAdvanceMs(after) > getOrderSimulatedAdvanceMs(before);
  if (!advanced) {
    return 'Không thể cộng thêm thời gian mô phỏng cho đơn này.';
  }
  if (isPreOrderAwaitingFulfillment(before)) {
    const hint = formatPreOrderDeadlineRemainingLabel(after, Date.now());
    return hint
      ? `Đã +3 ngày (đặt trước). ${hint}`
      : 'Đã vượt hạn giao đặt trước — đơn phải chuyển Thất bại (hoàn tiền nếu đã thanh toán).';
  }
  if (before.status === 'Tạm giữ tiền') {
    const hint = formatEscrowRemainingLabel(after, Date.now());
    return hint
      ? `Đã +3 ngày tạm giữ ví. ${hint}`
      : 'Đã +3 ngày. Chưa Hoàn thành — kiểm tra trạng thái đơn (phải là Tạm giữ tiền).';
  }
  if (before.status === 'Khiếu nại') {
    return 'Đã +3 ngày. Chưa Thất bại: kiểm tra complaintStartedAtMs hoặc đơn đã xử lý.';
  }
  if (before.status === 'Tranh chấp') {
    return 'Đã +3 ngày. Chưa hoàn tiền: kiểm tra disputeStartedAtMs hoặc đơn đã xử lý.';
  }
  if (before.status === 'Chờ xác nhận' && before.order_type === 'service') {
    const hint = formatServiceDeadlineRemainingLabel(after, Date.now());
    return hint
      ? `Đã tăng thời gian mô phỏng. ${hint}`
      : 'Đã vượt hạn xác nhận — bấm lại nếu trạng thái chưa Thất bại.';
  }
  if (before.status === 'Đang thực hiện' && before.order_type === 'service') {
    const hint = formatServiceDeadlineRemainingLabel(after, Date.now());
    return hint
      ? `Đã tăng thời gian mô phỏng. ${hint}`
      : 'Shop chưa giao nội dung — bấm lại sau khi quá hạn giao dịch vụ.';
  }
  return 'Đã +3 ngày mô phỏng. Trạng thái hiện tại không có hẹn giờ tự động.';
}
